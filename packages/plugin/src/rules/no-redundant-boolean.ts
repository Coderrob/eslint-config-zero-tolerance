/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AST_NODE_TYPES, ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { OPERATOR_STRICT_EQ, OPERATOR_STRICT_NEQ } from '../rule-constants';
import { isBoolean } from '../type-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * Returns true when the node is a boolean literal (true or false).
 *
 * @param node - The node to check.
 * @returns True if the node is a boolean literal, false otherwise.
 */
function isBooleanLiteral(node: TSESTree.Node): boolean {
  return node.type === AST_NODE_TYPES.Literal && isBoolean((node as TSESTree.Literal).value);
}

/**
 * Returns true when operator is strict equality/inequality.
 *
 * @param operator - The operator to check.
 * @returns True if the operator is strict comparison, false otherwise.
 */
function isStrictComparisonOperator(operator: string): boolean {
  return operator === OPERATOR_STRICT_EQ || operator === OPERATOR_STRICT_NEQ;
}

/**
 * Returns true when replacement expression should negate the non-literal side.
 *
 * @param operator - The comparison operator.
 * @param literalValue - The boolean literal value.
 * @returns True if the expression should be negated, false otherwise.
 */
function shouldNegateComparison(operator: string, literalValue: boolean): boolean {
  if (operator === OPERATOR_STRICT_EQ) {
    return literalValue === false;
  }
  return literalValue === true;
}

/**
 * Returns true when either comparison side is a boolean literal.
 *
 * @param node - The binary expression node to check.
 * @returns True if either operand is a boolean literal, false otherwise.
 */
function hasBooleanLiteralOperand(node: TSESTree.BinaryExpression): boolean {
  if (isBooleanLiteral(node.left)) {
    return true;
  }
  return isBooleanLiteral(node.right);
}

/**
 * Returns the non-literal side, unless right literal compares against private identifier.
 *
 * @param node - The binary expression node.
 * @returns The non-literal side expression, or null if not applicable.
 */
function getNonLiteralSide(node: TSESTree.BinaryExpression): TSESTree.Expression | null {
  if (isBooleanLiteral(node.left)) {
    return node.right;
  }
  return getRightLiteralNonPrivateSide(node);
}

/** Returns left side when right side is a fixable boolean literal comparison. */
function getRightLiteralNonPrivateSide(
  node: TSESTree.BinaryExpression,
): TSESTree.Expression | null {
  return node.left.type === AST_NODE_TYPES.PrivateIdentifier ? null : node.left;
}

/**
 * Returns the boolean literal value from either side of the comparison.
 *
 * @param node - The binary expression node.
 * @returns The boolean literal value, or null if not found.
 */
function getBooleanLiteralValue(node: TSESTree.BinaryExpression): boolean | null {
  if (isBooleanLiteral(node.left)) {
    return Boolean((node.left as TSESTree.Literal).value);
  }
  return Boolean((node.right as TSESTree.Literal).value);
}

/** Returns fix inputs for redundant boolean comparisons, or null when not fixable. */
function getFixInputs(
  node: TSESTree.BinaryExpression,
): { nonLiteralSide: TSESTree.Expression; literalValue: boolean } | null {
  if (!isRedundantBooleanComparison(node)) {
    return null;
  }
  const nonLiteralSide = getNonLiteralSide(node);
  if (nonLiteralSide === null) {
    return null;
  }
  return { nonLiteralSide, literalValue: getBooleanLiteralValue(node) as boolean };
}

/** Returns true when node is strict comparison against at least one boolean literal. */
function isRedundantBooleanComparison(node: TSESTree.BinaryExpression): boolean {
  if (!isStrictComparisonOperator(node.operator)) {
    return false;
  }
  return hasBooleanLiteralOperand(node);
}

/**
 * ESLint rule that disallows redundant comparisons to boolean literals.
 */
export const noRedundantBoolean = createRule({
  name: 'no-redundant-boolean',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Disallow redundant comparisons to boolean literals (Sonar S1125)',
    },
    messages: {
      redundantBoolean:
        'Redundant comparison to a boolean literal; use the value directly or negate it with "!"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Creates a deterministic replacement fixer for a redundant comparison.
     *
     * @param node - The binary expression node.
     * @param nonLiteralSide - The non-literal side expression.
     * @param literalValue - The boolean literal value.
     * @returns A fixer function.
     */
    const createFix = (
      node: TSESTree.BinaryExpression,
      nonLiteralSide: TSESTree.Expression,
      literalValue: boolean,
    ) => {
      return (fixer: TSESLint.RuleFixer) => {
        const expressionText = sourceCode.getText(nonLiteralSide);
        const replacement = shouldNegateComparison(node.operator, literalValue)
          ? `!(${expressionText})`
          : expressionText;
        return fixer.replaceText(node, replacement);
      };
    };

    /**
     * Reports redundant strict comparisons to boolean literals.
     *
     * @param node - The binary expression node to check.
     */
    const checkBinaryExpression = (node: TSESTree.BinaryExpression): void => {
      const fixInputs = getFixInputs(node);
      if (fixInputs === null) {
        return;
      }

      context.report({
        node,
        messageId: 'redundantBoolean',
        fix: createFix(node, fixInputs.nonLiteralSide, fixInputs.literalValue),
      });
    };

    return {
      BinaryExpression: checkBinaryExpression,
    };
  },
});

export default noRedundantBoolean;
