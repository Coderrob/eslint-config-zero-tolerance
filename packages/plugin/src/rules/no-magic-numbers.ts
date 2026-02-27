import { ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { OPERATOR_UNARY_MINUS, VARIABLE_KIND_CONST } from '../rule-constants';
import { isNumber } from '../type-guards';
import {
  isTSEnumMemberNode,
  isUnaryExpressionNode,
  isVariableDeclaratorNode,
  isVariableDeclarationNode,
} from '../ast-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * Returns true when a numeric literal has one of the universally-understood
 * values that do not require a named constant: 0, 1, or -1.
 *
 * @param node - The literal node to check.
 * @returns True if the value is allowed, false otherwise.
 */
function isAllowedValue(node: TSESTree.Literal): boolean {
  if (node.value === 0 || node.value === 1) {
    return true;
  }
  return isNegativeOneLiteral(node);
}

/**
 * Returns true when the numeric literal is the direct initializer of a
 * `const` variable declaration, making it a named constant.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in a const declaration, false otherwise.
 */
function isInConstDeclaration(node: TSESTree.Literal): boolean {
  const variableDeclarator = getVariableDeclarator(node);
  if (variableDeclarator === null) {
    return false;
  }
  return isConstVariableDeclaration(variableDeclarator.parent);
}

/**
 * Returns true when the numeric literal is the initializer of a TypeScript
 * enum member, which gives it an implicit name.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in an enum member, false otherwise.
 */
function isInEnumMember(node: TSESTree.Literal): boolean {
  return isTSEnumMemberNode(node.parent);
}

/**
 * Returns true for unary '-' expression nodes.
 *
 * @param node - The node to check.
 * @returns True if the node is a unary minus expression, false otherwise.
 */
function isUnaryMinus(node: TSESTree.Node | undefined): node is TSESTree.UnaryExpression {
  if (!isUnaryExpressionNode(node)) {
    return false;
  }
  return node.operator === OPERATOR_UNARY_MINUS;
}

/**
 * Returns true when a literal is represented as `-1` in the AST.
 *
 * @param node - The literal node to check.
 * @returns True if the literal represents -1, false otherwise.
 */
function isNegativeOneLiteral(node: TSESTree.Literal): boolean {
  if (node.value !== 1) {
    return false;
  }
  return isUnaryMinus(node.parent);
}

/**
 * Returns the owning variable declarator for a literal or unary-minus wrapper.
 *
 * @param node - The literal node to find the declarator for.
 * @returns The variable declarator if found, otherwise null.
 */
function getVariableDeclarator(node: TSESTree.Literal): TSESTree.VariableDeclarator | null {
  if (isUnaryMinus(node.parent)) {
    return getDirectVariableDeclarator(node.parent);
  }
  return getDirectVariableDeclarator(node);
}

/** Returns variable declarator directly owning the node, when present. */
function getDirectVariableDeclarator(node: TSESTree.Node): TSESTree.VariableDeclarator | null {
  if (!isVariableDeclaratorNode(node.parent)) {
    return null;
  }
  return node.parent;
}

/**
 * Returns true when a numeric literal is exempt from magic-number reporting.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is allowed, false otherwise.
 */
function isAllowedNumericLiteral(node: TSESTree.Literal): boolean {
  if (isAllowedValue(node)) {
    return true;
  }
  if (isInConstDeclaration(node)) {
    return true;
  }
  return isInEnumMember(node);
}

/** Returns true when declaration node is a const variable declaration. */
function isConstVariableDeclaration(node: TSESTree.Node | undefined): boolean {
  if (!isVariableDeclarationNode(node)) {
    return false;
  }
  return node.kind === VARIABLE_KIND_CONST;
}

/** Returns normalized raw text for numeric literal reporting. */
function getNumericLiteralText(
  node: TSESTree.Literal,
  sourceCode: Readonly<TSESLint.SourceCode>,
): string {
  if (node.raw !== null) {
    return node.raw;
  }
  return sourceCode.getText(node);
}

/**
 * ESLint rule that disallows magic numbers; use named constants instead of raw numeric literals.
 */
export const noMagicNumbers = createRule({
  name: 'no-magic-numbers',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow magic numbers; use named constants instead of raw numeric literals',
    },
    messages: {
      noMagicNumbers: 'Magic number {{value}} is not allowed; extract it into a named constant',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that detects magic numbers.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a literal node for magic numbers.
     *
     * @param node - The literal node to check.
     */
    const checkLiteral = (node: TSESTree.Literal): void => {
      if (!isNumber(node.value)) {
        return;
      }

      if (isAllowedNumericLiteral(node)) {
        return;
      }

      const rawValue = getNumericLiteralText(node, context.sourceCode);
      context.report({
        node,
        messageId: 'noMagicNumbers',
        data: { value: rawValue },
      });
    };

    return {
      Literal: checkLiteral,
    };
  },
});

export default noMagicNumbers;
