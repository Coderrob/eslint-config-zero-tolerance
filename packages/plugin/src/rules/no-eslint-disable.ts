import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const noEslintDisable = createRule({
  name: 'no-eslint-disable',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent use of eslint-disable comments',
      recommended: 'recommended',
    },
    messages: {
      noEslintDisable:
        'ESLint disable comments are not allowed; fix the underlying issue instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program() {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();
        for (const comment of comments) {
          const value = comment.value.trim();
          if (value.startsWith('eslint-disable')) {
            context.report({
              loc: comment.loc!,
              messageId: 'noEslintDisable',
            });
          }
        }
      },
    };
  },
});

export default noEslintDisable;
