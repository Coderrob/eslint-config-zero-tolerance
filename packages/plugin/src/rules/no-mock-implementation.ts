import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const BANNED_MOCK_METHODS: Record<string, string> = {
  mockImplementation: 'mockImplementationOnce',
  mockReturnValue: 'mockReturnValueOnce',
  mockResolvedValue: 'mockResolvedValueOnce',
  mockRejectedValue: 'mockRejectedValueOnce',
};

export const noMockImplementation = createRule({
  name: 'no-mock-implementation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prohibit persistent mock implementations; use the Once variants to avoid test bleeds',
      recommended: 'recommended',
    },
    messages: {
      noMockImplementation:
        '"{{method}}" is not allowed; use "{{replacement}}" to avoid test bleeds',
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
        const replacement = BANNED_MOCK_METHODS[name];

        if (replacement) {
          context.report({
            node: node.property,
            messageId: 'noMockImplementation',
            data: {
              method: name,
              replacement,
            },
          });
        }
      },
    };
  },
});

export default noMockImplementation;
