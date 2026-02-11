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
        // Check for it() or test() calls (including it.only, test.only, but excluding it.skip, test.skip)
        let isTestCall = false;
        
        if (node.callee.type === 'Identifier' &&
            (node.callee.name === 'it' || node.callee.name === 'test')) {
          isTestCall = true;
        } else if (node.callee.type === 'MemberExpression' &&
                   node.callee.object.type === 'Identifier' &&
                   (node.callee.object.name === 'it' || node.callee.object.name === 'test')) {
          // Support .only but skip .skip to avoid annoyances
          if (node.callee.property.type === 'Identifier' && 
              node.callee.property.name === 'skip') {
            return; // Don't enforce on skipped tests
          }
          isTestCall = true;
        }
        
        if (isTestCall && node.arguments.length > 0) {
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
