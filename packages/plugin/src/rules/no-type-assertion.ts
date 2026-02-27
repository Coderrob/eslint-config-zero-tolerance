import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { TYPE_ASSERTION_ALLOWED_IN_TESTS } from '../rule-constants';
import { isTestFile } from '../ast-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that prevents use of TypeScript "as" type assertions.
 */
export const noTypeAssertion = createRule({
  name: 'no-type-assertion',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent use of TypeScript "as" type assertions',
    },
    messages: {
      noTypeAssertion: 'Type assertion "as {{type}}" is not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that prevents TypeScript type assertions.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a TypeScript "as" expression for validity.
     *
     * @param node - The TSAsExpression node to check.
     */
    const checkTSAsExpression = (node: TSESTree.TSAsExpression): void => {
      const filename = context.filename;
      const typeText = context.sourceCode.getText(node.typeAnnotation);

      // Allow specific type assertions in test files
      if (isTestFile(filename) && typeText.trim() === TYPE_ASSERTION_ALLOWED_IN_TESTS) {
        return;
      }

      context.report({
        node,
        messageId: 'noTypeAssertion',
        data: { type: typeText },
      });
    };

    return {
      TSAsExpression: checkTSAsExpression,
    };
  },
});

export default noTypeAssertion;
