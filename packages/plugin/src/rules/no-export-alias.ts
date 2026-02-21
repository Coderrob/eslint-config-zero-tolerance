import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

function getSpecifierName(node: TSESTree.Identifier | TSESTree.StringLiteral): string | null {
  if (node.type === 'Identifier') {
    return node.name;
  }
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  return null;
}

export const noExportAlias = createRule({
  name: 'no-export-alias',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent use of alias in export statements',
      recommended: 'recommended',
    },
    messages: {
      noExportAlias: 'Export alias "{{alias}}" is not allowed; export "{{local}}" directly',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        for (const specifier of node.specifiers) {
          const localName = getSpecifierName(specifier.local);
          const exportedName = getSpecifierName(specifier.exported);

          if (localName === null || exportedName === null) {
            continue;
          }

          if (localName !== exportedName) {
            context.report({
              node: specifier,
              messageId: 'noExportAlias',
              data: {
                local: localName,
                alias: exportedName,
              },
            });
          }
        }
      },
    };
  },
});

export default noExportAlias;
