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

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { isBoolean } from '../helpers/type-guards';
import { OPERATOR_STRICT_EQ, OPERATOR_STRICT_NEQ } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type FixInputs = Readonly<{
  literalValue: boolean;
  nonLiteralSide: TSESTree.Expression;
}>;

type StrictComparisonExpression = TSESTree.BinaryExpression & {
  left: TSESTree.Expression;
  operator: typeof OPERATOR_STRICT_EQ | typeof OPERATOR_STRICT_NEQ;
  right: TSESTree.Expression;
};

type RedundantBooleanComparisonExpression = StrictComparisonExpression &
  (
    | { left: TSESTree.Literal & { value: boolean } }
    | { right: TSESTree.Literal & { value: boolean } }
  );

/** Rule context type for `no-redundant-boolean`. */
type NoRedundantBooleanContext = Readonly<TSESLint.RuleContext<'redundantBoolean', []>>;

/**
 * Checks a binary expression and reports when it compares a value against a boolean literal.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - Binary expression to inspect.
 */
function checkBinaryExpression(
  context: NoRedundantBooleanContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.BinaryExpression,
): void {
  const fixInputs = getFixInputs(node);
  if (fixInputs === null) {
    return;
  }
  context.report({
    node,
    messageId: 'redundantBoolean',
    fix: createFix(sourceCode, node, fixInputs),
  });
}

/**
 * Creates a deterministic replacement fixer for redundant comparisons.
 *
 * @param sourceCode - Source code helper.
 * @param node - The binary expression being fixed.
 * @param fixInputs - Precomputed fix inputs.
 * @returns A fixer callback for ESLint.
 */
function createFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.BinaryExpression,
  fixInputs: FixInputs,
): TSESLint.ReportFixFunction {
  return replaceRedundantBooleanComparison.bind(undefined, sourceCode, node, fixInputs);
}

/**
 * Creates listeners for no-redundant-boolean rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoRedundantBooleanListeners(
  context: NoRedundantBooleanContext,
): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;
  return {
    BinaryExpression: checkBinaryExpression.bind(undefined, context, sourceCode),
  };
}

/**
 * Creates the replacement text for redundant boolean comparisons.
 *
 * @param sourceCode - Source code helper.
 * @param node - Binary expression being replaced.
 * @param fixInputs - Precomputed fix inputs.
 * @returns Replacement expression text.
 */
function createReplacementText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.BinaryExpression,
  fixInputs: FixInputs,
): string {
  const expressionText = sourceCode.getText(fixInputs.nonLiteralSide);
  if (!shouldNegateComparison(node.operator, fixInputs.literalValue)) {
    return expressionText;
  }
  return `!(${expressionText})`;
}

/**
 * Returns fix inputs for redundant boolean comparisons, or null when not fixable.
 *
 * @param node - Binary expression to inspect.
 * @returns Fix inputs when expression is redundant, otherwise null.
 */
function getFixInputs(node: TSESTree.BinaryExpression): FixInputs | null {
  if (!isRedundantBooleanComparison(node)) {
    return null;
  }
  if (hasBooleanLiteralLeftOperand(node)) {
    return { literalValue: node.left.value, nonLiteralSide: node.right };
  }
  return {
    literalValue: node.right.value,
    nonLiteralSide: node.left,
  };
}

/**
 * Returns true when redundant comparison has a boolean literal on the left side.
 *
 * @param node - Redundant boolean comparison expression.
 * @returns True when left operand is a boolean literal.
 */
function hasBooleanLiteralLeftOperand(
  node: RedundantBooleanComparisonExpression,
): node is StrictComparisonExpression & { left: TSESTree.Literal & { value: boolean } } {
  return isBooleanLiteral(node.left);
}

/**
 * Returns true when either comparison side is a boolean literal.
 *
 * @param node - The binary expression node to check.
 * @returns True if either operand is a boolean literal, false otherwise.
 */
function hasBooleanLiteralOperand(
  node: StrictComparisonExpression,
): node is RedundantBooleanComparisonExpression {
  if (isBooleanLiteral(node.left)) {
    return true;
  }
  return isBooleanLiteral(node.right);
}

/**
 * Returns true when the node is a boolean literal (true or false).
 *
 * @param node - The node to check.
 * @returns True if the node is a boolean literal, false otherwise.
 */
function isBooleanLiteral(node: TSESTree.Node): node is TSESTree.Literal & { value: boolean } {
  return node.type === AST_NODE_TYPES.Literal && isBoolean(node.value);
}

/**
 * Returns true when node is strict comparison against at least one boolean literal.
 *
 * @param node - Binary expression to inspect.
 * @returns True when expression compares against a boolean literal.
 */
function isRedundantBooleanComparison(
  node: TSESTree.BinaryExpression,
): node is RedundantBooleanComparisonExpression {
  if (!isStrictComparisonExpression(node)) {
    return false;
  }
  return hasBooleanLiteralOperand(node);
}

/**
 * Returns true when node is a strict comparison expression.
 *
 * @param node - Binary expression to inspect.
 * @returns True when operator is strict equality/inequality.
 */
function isStrictComparisonExpression(
  node: TSESTree.BinaryExpression,
): node is StrictComparisonExpression {
  return isStrictComparisonOperator(node.operator);
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
 * Applies a replacement fix for a redundant boolean comparison.
 *
 * @param sourceCode - Source code helper.
 * @param node - Binary expression being replaced.
 * @param fixInputs - Precomputed fix inputs.
 * @param fixer - ESLint fixer.
 * @returns Generated text replacement fix.
 */
function replaceRedundantBooleanComparison(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.BinaryExpression,
  fixInputs: FixInputs,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  return fixer.replaceText(node, createReplacementText(sourceCode, node, fixInputs));
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
    return !literalValue;
  }
  return literalValue;
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
  create: createNoRedundantBooleanListeners,
});

export default noRedundantBoolean;
