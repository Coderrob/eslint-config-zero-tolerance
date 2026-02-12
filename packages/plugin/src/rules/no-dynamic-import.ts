import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const noDynamicImport = createRule({
  name: 'no-dynamic-import',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban await import() and require() except in test files',
      recommended: 'recommended',
    },
    messages: {
      noDynamicImport: 'Dynamic import() with await is not allowed outside of test files',
      noRequire: 'require() is not allowed outside of test files',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    const isTestFile = /\.(test|spec)\.[jt]sx?$/.test(filename);

    // Skip checking if it's a test file
    if (isTestFile) {
      return {};
    }

    return {
      AwaitExpression(node) {
        // Check if awaiting an import() call
        if (
          node.argument.type === 'ImportExpression'
        ) {
          context.report({
            node,
            messageId: 'noDynamicImport',
          });
        }
      },
      CallExpression(node) {
        // Check for require() calls
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require'
        ) {
          context.report({
            node,
            messageId: 'noRequire',
          });
        }
      },
    };
  },
});

export default noDynamicImport;
