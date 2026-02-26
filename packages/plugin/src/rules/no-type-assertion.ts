import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const TEST_FILE_PATTERN = /\.(test|spec)\.[jt]sx?$/;

/**
 * Determines whether the given filename belongs to a test file.
 */
function isTestFile(filename: string): boolean {
  return TEST_FILE_PATTERN.test(filename);
}

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
  create(context) {
    return {
      TSAsExpression(node) {
        const filename = context.getFilename();
        const typeText = context.getSourceCode().getText(node.typeAnnotation);
        if (isTestFile(filename) && typeText.trim() === 'unknown') {
          return;
        }
        context.report({
          node,
          messageId: 'noTypeAssertion',
          data: { type: typeText },
        });
      },
    };
  },
});

export default noTypeAssertion;
