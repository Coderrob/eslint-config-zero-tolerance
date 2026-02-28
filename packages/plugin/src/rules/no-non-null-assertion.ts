import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that disallows non-null assertions using the "!" postfix operator.
 */
export const noNonNullAssertion = createRule({
  name: 'no-non-null-assertion',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow non-null assertions using the "!" postfix operator',
    },
    messages: {
      noNonNullAssertion:
        'Non-null assertion "!" bypasses TypeScript\'s type safety; use optional chaining or a proper null check instead',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that prevents TypeScript non-null assertions.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a TypeScript non-null expression.
     *
     * @param node - The TSNonNullExpression node to check.
     */
    const checkTSNonNullExpression = (node: TSESTree.TSNonNullExpression): void => {
      context.report({ node, messageId: 'noNonNullAssertion' });
    };

    return {
      TSNonNullExpression: checkTSNonNullExpression,
    };
  },
});

export default noNonNullAssertion;
