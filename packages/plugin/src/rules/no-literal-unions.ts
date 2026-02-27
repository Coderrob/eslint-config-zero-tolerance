import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { isBoolean } from '../type-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that prohibits literal unions in favor of enums.
 */
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
  /**
   * Creates an ESLint rule that detects literal unions.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks if a type node represents a boolean literal type.
     *
     * @param type - The type node to check.
     * @returns True if the type is a boolean literal.
     */
    const isBooleanLiteralType = (type: TSESTree.TypeNode): boolean => {
      return (
        type.type === AST_NODE_TYPES.TSLiteralType &&
        type.literal.type === AST_NODE_TYPES.Literal &&
        isBoolean(type.literal.value)
      );
    };

    /**
     * Checks if a union type contains literal types that should be banned.
     *
     * @param node - The union type node to check.
     */
    const checkTSUnionType = (node: TSESTree.TSUnionType): void => {
      // Allow boolean literal unions (true | false)
      if (node.types.every(isBooleanLiteralType)) {
        return;
      }

      // Check if this union contains literal types
      const hasLiterals = node.types.some((type) => {
        return (
          type.type === AST_NODE_TYPES.TSLiteralType &&
          (type.literal.type === AST_NODE_TYPES.Literal ||
            type.literal.type === AST_NODE_TYPES.TemplateLiteral)
        );
      });

      if (!hasLiterals) {
        return;
      }

      context.report({
        node,
        messageId: 'noLiteralUnions',
      });
    };

    return {
      TSUnionType: checkTSUnionType,
    };
  },
});

export default noLiteralUnions;
