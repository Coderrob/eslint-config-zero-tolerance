import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const noRelativeParentImports = createRule({
  name: 'no-relative-parent-imports',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban ../ re-exports and imports',
      recommended: 'recommended',
    },
    messages: {
      noRelativeParentImports: 'Parent directory imports/re-exports using ../ are not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkImportPath(node: any, source: string) {
      if (source.includes('../')) {
        context.report({
          node,
          messageId: 'noRelativeParentImports',
        });
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value && typeof node.source.value === 'string') {
          checkImportPath(node, node.source.value);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source?.value && typeof node.source.value === 'string') {
          checkImportPath(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        if (node.source.value && typeof node.source.value === 'string') {
          checkImportPath(node, node.source.value);
        }
      },
    };
  },
});

export default noRelativeParentImports;
