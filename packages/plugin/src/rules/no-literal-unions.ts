import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const noLiteralUnions = createRule({
  name: 'no-literal-unions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ban literal unions in favor of enums',
    },
    messages: {
      noLiteralUnions: 'Literal unions are not allowed, use an enum instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const isBooleanLiteralType = (type: TSESTree.TypeNode): boolean => {
      return (
        type.type === 'TSLiteralType' &&
        type.literal.type === 'Literal' &&
        typeof type.literal.value === 'boolean'
      );
    };

    return {
      TSUnionType(node) {
        const isBooleanLiteralUnion = node.types.every(isBooleanLiteralType);
        if (isBooleanLiteralUnion) {
          return;
        }

        // Check if this union contains literal types
        const hasLiterals = node.types.some((type) => {
          return (
            type.type === 'TSLiteralType' &&
            (type.literal.type === 'Literal' || type.literal.type === 'TemplateLiteral')
          );
        });

        if (hasLiterals) {
          context.report({
            node,
            messageId: 'noLiteralUnions',
          });
        }
      },
    };
  },
});

export default noLiteralUnions;
