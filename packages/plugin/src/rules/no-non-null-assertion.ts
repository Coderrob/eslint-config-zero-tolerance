import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const noNonNullAssertion = createRule({
  name: 'no-non-null-assertion',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-null assertions using the "!" postfix operator',
      recommended: 'recommended',
    },
    messages: {
      noNonNullAssertion:
        'Non-null assertion "!" bypasses TypeScript\'s type safety; use optional chaining or a proper null check instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSNonNullExpression(node) {
        context.report({ node, messageId: 'noNonNullAssertion' });
      },
    };
  },
});

export default noNonNullAssertion;
