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
        'Prohibit toHaveBeenCalled and toHaveBeenCalledWith; instead use toHaveBeenCalledTimes with an explicit call count and toHaveBeenNthCalledWith with an explicit nth-call index and arguments',
      recommended: 'recommended',
    },
    messages: {
      noHaveBeenCalled:
        '"{{matcher}}" is not allowed; use "{{replacement}}" with an explicit call count (and nth-call index when applicable) instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        let name: string | null = null;

        if (!node.computed && node.property.type === 'Identifier') {
          name = node.property.name;
        } else if (
          node.computed &&
          node.property.type === 'Literal' &&
          typeof node.property.value === 'string'
        ) {
          name = node.property.value;
        }

        if (!name) {
          return;
        }

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
