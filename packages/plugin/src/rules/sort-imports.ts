import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const GROUP_NAMES = ['external', 'parent', 'peer', 'index'] as const;

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
    docs: {
      description:
        'Require import declarations to be grouped (external → parent → peer → index) and sorted alphabetically within each group',
      recommended: 'recommended',
    },
    messages: {
      unsortedImport: 'Import "{{current}}" should come before "{{previous}}"',
      wrongGroup:
        'Import "{{current}}" ({{currentGroup}}) must appear before "{{previous}}" ({{previousGroup}})',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const imports: TSESTree.ImportDeclaration[] = [];

    return {
      ImportDeclaration(node) {
        imports.push(node);
      },
      'Program:exit'() {
        for (let i = 1; i < imports.length; i++) {
          const previous = imports[i - 1].source.value as string;
          const current = imports[i].source.value as string;
          const previousGroup = getImportGroup(previous);
          const currentGroup = getImportGroup(current);

          if (currentGroup < previousGroup) {
            context.report({
              node: imports[i],
              messageId: 'wrongGroup',
              data: {
                current,
                previous,
                currentGroup: GROUP_NAMES[currentGroup],
                previousGroup: GROUP_NAMES[previousGroup],
              },
            });
          } else if (
            currentGroup === previousGroup &&
            current.toLowerCase() < previous.toLowerCase()
          ) {
            context.report({
              node: imports[i],
              messageId: 'unsortedImport',
              data: { current, previous },
            });
          }
        }
      },
    };
  },
});

export default sortImports;
