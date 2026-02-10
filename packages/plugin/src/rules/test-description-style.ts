import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const testDescriptionStyle = createRule({
  name: 'test-description-style',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that test descriptions start with "should"',
      recommended: 'recommended',
    },
    messages: {
      testDescriptionStyle: 'Test description should start with "should"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check for it() or test() calls
        if (
          node.callee.type === 'Identifier' &&
          (node.callee.name === 'it' || node.callee.name === 'test') &&
          node.arguments.length > 0
        ) {
          const firstArg = node.arguments[0];
          if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
            const description = firstArg.value.trim();
            if (!description.startsWith('should')) {
              context.report({
                node: firstArg,
                messageId: 'testDescriptionStyle',
              });
            }
          }
        }
      },
    };
  },
});

export default testDescriptionStyle;
