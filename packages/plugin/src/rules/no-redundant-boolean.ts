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

const OPERATOR_LOGICAL_NOT = '!';

type FixInputs = Readonly<{
  literalValue: boolean;
  nonLiteralSide: TSESTree.Expression;
}>;
type ConditionalBooleanFixInputs = Readonly<{
  shouldNegate: boolean;
  test: TSESTree.Expression;
}>;
type BooleanLiteralValueInputs = Readonly<{
  value: boolean;
}>;
type ComparisonNegationInputs = Readonly<{
  literalValue: boolean;
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
  context: Readonly<NoRedundantBooleanContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.BinaryExpression>,
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
 * Checks a conditional expression and reports redundant boolean branches.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - Conditional expression to inspect.
 */
function checkConditionalExpression(
  context: Readonly<NoRedundantBooleanContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.ConditionalExpression>,
): void {
  const fixInputs = getConditionalBooleanFixInputs(node);
  if (fixInputs === null) {
    return;
  }
  context.report({
    node,
    messageId: 'redundantBoolean',
    fix: replaceRedundantBooleanConditional.bind(undefined, sourceCode, node, fixInputs),
  });
}

/**
 * Checks a unary expression and reports redundant double negation of boolean expressions.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - Unary expression to inspect.
 */
function checkUnaryExpression(
  context: Readonly<NoRedundantBooleanContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.UnaryExpression>,
): void {
  const innerExpression = getDoubleNegatedBooleanExpression(node);
  if (innerExpression === null) {
    return;
  }
  context.report({
    node,
    messageId: 'redundantBoolean',
    fix: replaceDoubleNegation.bind(undefined, sourceCode, node, innerExpression),
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
  node: Readonly<TSESTree.BinaryExpression>,
  fixInputs: Readonly<FixInputs>,
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
  context: Readonly<NoRedundantBooleanContext>,
): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;
  return {
    BinaryExpression: checkBinaryExpression.bind(undefined, context, sourceCode),
    ConditionalExpression: checkConditionalExpression.bind(undefined, context, sourceCode),
    UnaryExpression: checkUnaryExpression.bind(undefined, context, sourceCode),
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
  node: Readonly<TSESTree.BinaryExpression>,
  fixInputs: Readonly<FixInputs>,
): string {
  const expressionText = sourceCode.getText(fixInputs.nonLiteralSide);
  if (!shouldNegateComparison(node.operator, { literalValue: fixInputs.literalValue })) {
    return expressionText;
  }
  return `!(${expressionText})`;
}

/**
 * Returns fix inputs for a boolean conditional expression.
 *
 * @param node - Conditional expression to inspect.
 * @returns Fix inputs when the branches are redundant boolean literals.
 */
function getConditionalBooleanFixInputs(
  node: Readonly<TSESTree.ConditionalExpression>,
): ConditionalBooleanFixInputs | null {
  if (isDirectBooleanConditional(node)) {
    return { shouldNegate: false, test: node.test };
  }
  if (isNegatedBooleanConditional(node)) {
    return { shouldNegate: true, test: node.test };
  }
  return null;
}

/**
 * Returns the boolean expression inside a redundant double negation.
 *
 * @param node - Unary expression to inspect.
 * @returns Inner boolean expression when double negation is redundant.
 */
function getDoubleNegatedBooleanExpression(
  node: Readonly<TSESTree.UnaryExpression>,
): TSESTree.Expression | null {
  if (!isNestedLogicalNot(node)) {
    return null;
  }
  if (!isBooleanExpression(node.argument.argument)) {
    return null;
  }
  return node.argument.argument;
}

/**
 * Returns fix inputs for redundant boolean comparisons, or null when not fixable.
 *
 * @param node - Binary expression to inspect.
 * @returns Fix inputs when expression is redundant, otherwise null.
 */
function getFixInputs(node: Readonly<TSESTree.BinaryExpression>): FixInputs | null {
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
  node: Readonly<RedundantBooleanComparisonExpression>,
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
  node: Readonly<StrictComparisonExpression>,
): node is RedundantBooleanComparisonExpression {
  if (isBooleanLiteral(node.left)) {
    return true;
  }
  return isBooleanLiteral(node.right);
}

/**
 * Returns true when the expression is syntactically known to produce a boolean.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is boolean-valued.
 */
function isBooleanExpression(node: Readonly<TSESTree.Expression>): boolean {
  return (
    isBooleanLiteral(node) ||
    (node.type === AST_NODE_TYPES.BinaryExpression && isComparisonOperator(node.operator))
  );
}

/**
 * Returns true when the node is a boolean literal (true or false).
 *
 * @param node - The node to check.
 * @returns True if the node is a boolean literal, false otherwise.
 */
function isBooleanLiteral(
  node: Readonly<TSESTree.Node>,
): node is TSESTree.Literal & { value: boolean } {
  return node.type === AST_NODE_TYPES.Literal && isBoolean(node.value);
}

/**
 * Returns true when the node is a boolean literal with a specific value.
 *
 * @param node - Node to inspect.
 * @param value - Expected boolean value.
 * @returns True when the node is the expected boolean literal.
 */
function isBooleanLiteralWithValue(
  node: Readonly<TSESTree.Node>,
  inputs: Readonly<BooleanLiteralValueInputs>,
): boolean {
  return isBooleanLiteral(node) && node.value === inputs.value;
}

/**
 * Returns true when an operator produces a boolean comparison result.
 *
 * @param operator - Operator to inspect.
 * @returns True when the operator is a comparison operator.
 */
function isComparisonOperator(operator: string): boolean {
  return ['===', '!==', '==', '!=', '>', '>=', '<', '<='].includes(operator);
}

/**
 * Returns true when a conditional expression has `true : false` branches.
 *
 * @param node - Conditional expression to inspect.
 * @returns True when branches directly mirror the test.
 */
function isDirectBooleanConditional(node: Readonly<TSESTree.ConditionalExpression>): boolean {
  return (
    isBooleanLiteralWithValue(node.consequent, { value: true }) &&
    isBooleanLiteralWithValue(node.alternate, { value: false })
  );
}

/**
 * Returns true when a conditional expression has `false : true` branches.
 *
 * @param node - Conditional expression to inspect.
 * @returns True when branches negate the test.
 */
function isNegatedBooleanConditional(node: Readonly<TSESTree.ConditionalExpression>): boolean {
  return (
    isBooleanLiteralWithValue(node.consequent, { value: false }) &&
    isBooleanLiteralWithValue(node.alternate, { value: true })
  );
}

/**
 * Returns true when a unary expression is a double logical-not expression.
 *
 * @param node - Unary expression to inspect.
 * @returns True when the expression starts with `!!`.
 */
function isNestedLogicalNot(
  node: Readonly<TSESTree.UnaryExpression>,
): node is TSESTree.UnaryExpression & { argument: TSESTree.UnaryExpression } {
  return (
    node.operator === OPERATOR_LOGICAL_NOT &&
    node.argument.type === AST_NODE_TYPES.UnaryExpression &&
    node.argument.operator === OPERATOR_LOGICAL_NOT
  );
}

/**
 * Returns true when node is strict comparison against at least one boolean literal.
 *
 * @param node - Binary expression to inspect.
 * @returns True when expression compares against a boolean literal.
 */
function isRedundantBooleanComparison(
  node: Readonly<TSESTree.BinaryExpression>,
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
  node: Readonly<TSESTree.BinaryExpression>,
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
 * Applies a replacement fix for redundant double negation.
 *
 * @param sourceCode - Source code helper.
 * @param node - Unary expression being replaced.
 * @param innerExpression - Inner boolean expression.
 * @param fixer - ESLint fixer.
 * @returns Generated text replacement fix.
 */
function replaceDoubleNegation(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.UnaryExpression>,
  innerExpression: Readonly<TSESTree.Expression>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  return fixer.replaceText(node, sourceCode.getText(innerExpression));
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
  node: Readonly<TSESTree.BinaryExpression>,
  fixInputs: Readonly<FixInputs>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  return fixer.replaceText(node, createReplacementText(sourceCode, node, fixInputs));
}

/**
 * Applies a replacement fix for a redundant boolean conditional.
 *
 * @param sourceCode - Source code helper.
 * @param node - Conditional expression being replaced.
 * @param fixInputs - Precomputed fix inputs.
 * @param fixer - ESLint fixer.
 * @returns Generated text replacement fix.
 */
function replaceRedundantBooleanConditional(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.ConditionalExpression>,
  fixInputs: Readonly<ConditionalBooleanFixInputs>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const testText = sourceCode.getText(fixInputs.test);
  const replacementText = fixInputs.shouldNegate ? `!(${testText})` : testText;
  return fixer.replaceText(node, replacementText);
}

/**
 * Returns true when replacement expression should negate the non-literal side.
 *
 * @param operator - The comparison operator.
 * @param literalValue - The boolean literal value.
 * @returns True if the expression should be negated, false otherwise.
 */
function shouldNegateComparison(
  operator: string,
  inputs: Readonly<ComparisonNegationInputs>,
): boolean {
  if (operator === OPERATOR_STRICT_EQ) {
    return !inputs.literalValue;
  }
  return inputs.literalValue;
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
