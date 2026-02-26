import { ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const GROUP_NAMES = ['external', 'parent', 'peer', 'index'] as const;

type ImportEntry = {
  node: TSESTree.ImportDeclaration;
  value: string;
  valueLower: string;
  group: number;
};

/**
 * Returns the group rank for an import path.
 * Groups are ordered: external (0) → parent (1) → peer (2) → index (3).
 */
function getImportGroup(importPath: string): number {
  if (!importPath.startsWith('.')) return 0;
  if (importPath === '..' || importPath.startsWith('../')) return 1;
  if (importPath === '.' || /^\.\/index(\.\w+)?$/.test(importPath)) return 3;
  return 2;
}

export const sortImports = createRule({
  name: 'sort-imports',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Require import declarations to be grouped (external → parent → peer → index) and sorted alphabetically within each group',
    },
    messages: {
      unsortedImport: 'Import "{{current}}" should come before "{{previous}}"',
      wrongGroup:
        'Import "{{current}}" ({{currentGroup}}) must appear before "{{previous}}" ({{previousGroup}})',
      wrongGroupAfter:
        'Import "{{current}}" ({{currentGroup}}) must appear after "{{next}}" ({{nextGroup}})',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const imports: ImportEntry[] = [];

    const getSwapFix = (
      previousImport: TSESTree.ImportDeclaration,
      currentImport: TSESTree.ImportDeclaration
    ) => {
      return (fixer: TSESLint.RuleFixer) => {
        const previousText = sourceCode.getText(previousImport);
        const currentText = sourceCode.getText(currentImport);
        const betweenText = sourceCode.text.slice(previousImport.range[1], currentImport.range[0]);
        const replacement = `${currentText}${betweenText}${previousText}`;

        return fixer.replaceTextRange(
          [previousImport.range[0], currentImport.range[1]],
          replacement
        );
      };
    };

    return {
      ImportDeclaration(node) {
        const value = node.source.value as string;
        imports.push({
          node,
          value,
          valueLower: value.toLowerCase(),
          group: getImportGroup(value),
        });
      },
      'Program:exit'() {
        if (imports.length < 2) {
          imports.length = 0;
          return;
        }

        const reportedNodes = new Set<TSESTree.ImportDeclaration>();

        let highestEntry: ImportEntry | null = null;
        for (const entry of imports) {
          if (
            highestEntry &&
            entry.group < highestEntry.group &&
            !reportedNodes.has(entry.node)
          ) {
            context.report({
              node: entry.node,
              messageId: 'wrongGroup',
              data: {
                current: entry.value,
                previous: highestEntry.value,
                currentGroup: GROUP_NAMES[entry.group],
                previousGroup: GROUP_NAMES[highestEntry.group],
              },
              fix: getSwapFix(highestEntry.node, entry.node),
            });
            reportedNodes.add(entry.node);
          }

          if (!highestEntry || entry.group >= highestEntry.group) {
            highestEntry = entry;
          }
        }

        let lowestEntry: ImportEntry | null = null;
        for (let i = imports.length - 1; i >= 0; i--) {
          const entry = imports[i];

          if (
            lowestEntry &&
            entry.group > lowestEntry.group &&
            !reportedNodes.has(entry.node)
          ) {
            context.report({
              node: entry.node,
              messageId: 'wrongGroupAfter',
              data: {
                current: entry.value,
                next: lowestEntry.value,
                currentGroup: GROUP_NAMES[entry.group],
                nextGroup: GROUP_NAMES[lowestEntry.group],
              },
              fix: getSwapFix(entry.node, lowestEntry.node),
            });
            reportedNodes.add(entry.node);
          }

          if (!lowestEntry || entry.group <= lowestEntry.group) {
            lowestEntry = entry;
          }
        }

        const highestByGroup = new Map<number, ImportEntry>();
        for (const entry of imports) {
          if (reportedNodes.has(entry.node)) {
            continue;
          }

          const existing = highestByGroup.get(entry.group);
          if (existing && entry.valueLower < existing.valueLower) {
            context.report({
              node: entry.node,
              messageId: 'unsortedImport',
              data: { current: entry.value, previous: existing.value },
              fix: getSwapFix(existing.node, entry.node),
            });
            reportedNodes.add(entry.node);
          } else if (!existing || entry.valueLower > existing.valueLower) {
            highestByGroup.set(entry.group, entry);
          }
        }

        imports.length = 0;
      },
    };
  },
});

export default sortImports;
