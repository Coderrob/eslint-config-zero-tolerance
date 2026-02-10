import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const noBannedTypes = createRule({
  name: 'no-banned-types',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban ReturnType and indexed access types',
      recommended: 'recommended',
    },
    messages: {
      bannedReturnType: 'ReturnType is not allowed',
      bannedIndexedAccess: 'Indexed access types are not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSTypeReference(node) {
        // Check for ReturnType
        if (
          node.typeName.type === 'Identifier' &&
          node.typeName.name === 'ReturnType'
        ) {
          context.report({
            node,
            messageId: 'bannedReturnType',
          });
        }
      },
      TSIndexedAccessType(node) {
        // Ban all indexed access types
        context.report({
          node,
          messageId: 'bannedIndexedAccess',
        });
      },
    };
  },
});

export default noBannedTypes;
