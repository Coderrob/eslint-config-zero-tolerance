import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { CALLEE_REQUIRE } from '../rule-constants';
import { isTestFile } from '../ast-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that bans dynamic imports and require() calls except in test files.
 */
export const noDynamicImport = createRule({
  name: 'no-dynamic-import',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban await import() and require() except in test files',
    },
    messages: {
      noDynamicImport: 'Dynamic import() with await is not allowed outside of test files',
      noRequire: 'require() is not allowed outside of test files',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const isTest = isTestFile(filename);

    // Skip checking if it's a test file
    if (isTest) {
      return {};
    }

    return {
      /**
       * Checks await expressions for dynamic imports.
       *
       * @param node - The await expression node to check.
       */
      AwaitExpression(node) {
        // Check if awaiting an import() call
        if (node.argument.type === AST_NODE_TYPES.ImportExpression) {
          context.report({
            node,
            messageId: 'noDynamicImport',
          });
        }
      },
      /**
       * Checks call expressions for require() calls.
       *
       * @param node - The call expression node to check.
       */
      CallExpression(node) {
        // Check for require() calls
        if (node.callee.type === AST_NODE_TYPES.Identifier && node.callee.name === CALLEE_REQUIRE) {
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
