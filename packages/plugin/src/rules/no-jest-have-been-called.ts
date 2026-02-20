import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const BANNED_MATCHERS: Record<string, string> = {
  toHaveBeenCalled: 'toHaveBeenCalledTimes',
  toHaveBeenCalledWith: 'toHaveBeenNthCalledWith',
};

export const noJestHaveBeenCalled = createRule({
  name: 'no-jest-have-been-called',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prohibit toHaveBeenCalled and toHaveBeenCalledWith; use toHaveBeenCalledTimes and toHaveBeenNthCalledWith instead',
      recommended: 'recommended',
    },
    messages: {
      noHaveBeenCalled:
        '"{{matcher}}" is not allowed; use "{{replacement}}" instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (node.property.type !== 'Identifier') {
          return;
        }

        const name = node.property.name;
        const replacement = BANNED_MATCHERS[name];

        if (replacement) {
          context.report({
            node: node.property,
            messageId: 'noHaveBeenCalled',
            data: {
              matcher: name,
              replacement,
            },
          });
        }
      },
    };
  },
});

export default noJestHaveBeenCalled;
