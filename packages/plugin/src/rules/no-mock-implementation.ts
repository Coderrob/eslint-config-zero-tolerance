import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { getMemberPropertyName } from '../ast-helpers';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const BANNED_MOCK_METHODS: Record<string, string> = {
  mockImplementation: 'mockImplementationOnce',
  mockReturnValue: 'mockReturnValueOnce',
  mockResolvedValue: 'mockResolvedValueOnce',
  mockRejectedValue: 'mockRejectedValueOnce',
};

/**
 * ESLint rule that prohibits persistent mock implementations in favor of Once variants.
 */
export const noMockImplementation = createRule({
  name: 'no-mock-implementation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prohibit persistent mock implementations; use the Once variants to avoid test bleeds',
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
      /**
       * Checks member expressions for banned mock methods.
       *
       * @param node - The member expression node to check.
       */
      MemberExpression(node) {
        const name = getMemberPropertyName(node);
        if (!name) {
          return;
        }

        const replacement = BANNED_MOCK_METHODS[name];
        if (!replacement) {
          return;
        }

        context.report({
          node: node.property,
          messageId: 'noMockImplementation',
          data: {
            method: name,
            replacement,
          },
        });
      },
    };
  },
});

export default noMockImplementation;
