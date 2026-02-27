import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { getMemberPropertyName } from '../ast-helpers';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const BANNED_MATCHERS: Record<string, string> = {
  toBeCalled: 'toHaveBeenCalledTimes',
  toBeCalledWith: 'toHaveBeenNthCalledWith',
  toHaveBeenCalled: 'toHaveBeenCalledTimes',
  toHaveBeenCalledWith: 'toHaveBeenNthCalledWith',
  toHaveBeenLastCalledWith: 'toHaveBeenNthCalledWith',
  toLastCalledWith: 'toHaveBeenNthCalledWith',
};

/**
 * ESLint rule that prohibits deprecated Jest matchers in favor of explicit call count variants.
 */
export const noJestHaveBeenCalled = createRule({
  name: 'no-jest-have-been-called',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prohibit toBeCalled, toHaveBeenCalled, toBeCalledWith, toHaveBeenCalledWith, toHaveBeenLastCalledWith, and toLastCalledWith; use toHaveBeenCalledTimes with an explicit call count and toHaveBeenNthCalledWith with an explicit nth-call index and arguments instead',
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
      /**
       * Checks member expressions for banned Jest matchers.
       *
       * @param node - The member expression node to check.
       */
      MemberExpression(node) {
        const name = getMemberPropertyName(node);
        if (!name) {
          return;
        }

        const replacement = BANNED_MATCHERS[name];
        if (!replacement) {
          return;
        }

        context.report({
          node: node.property,
          messageId: 'noHaveBeenCalled',
          data: {
            matcher: name,
            replacement,
          },
        });
      },
    };
  },
});

export default noJestHaveBeenCalled;
