import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

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
          const localName =
            specifier.local.type === 'Identifier'
              ? specifier.local.name
              : (specifier.local as any).value;
          const exportedName =
            specifier.exported.type === 'Identifier'
              ? specifier.exported.name
              : (specifier.exported as any).value;

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
