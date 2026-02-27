import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { ESLINT_DISABLE_PREFIX } from '../rule-constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that prevents use of eslint-disable comments.
 */
export const noEslintDisable = createRule({
  name: 'no-eslint-disable',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent use of eslint-disable comments',
    },
    messages: {
      noEslintDisable: 'ESLint disable comments are not allowed; fix the underlying issue instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      /**
       * Checks the program for eslint-disable comments.
       */
      Program() {
        const sourceCode = context.sourceCode;
        const comments = sourceCode.getAllComments();
        for (const comment of comments) {
          const value = comment.value.trim();
          if (value.startsWith(ESLINT_DISABLE_PREFIX)) {
            context.report({
              loc: comment.loc,
              messageId: 'noEslintDisable',
            });
          }
        }
      },
    };
  },
});

export default noEslintDisable;
