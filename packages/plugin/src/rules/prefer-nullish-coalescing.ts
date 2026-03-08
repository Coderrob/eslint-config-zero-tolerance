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

import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../rule-factory';

const MESSAGE_ID = 'preferNullish';
const OPERATOR_LOOSE_EQUAL = '==';
const OPERATOR_LOOSE_NOT_EQUAL = '!=';

type NullishCandidate = Readonly<{
  expression: TSESTree.Expression;
  fallback: TSESTree.Expression;
}>;

type NullishCheck = Readonly<{
  expression: TSESTree.Expression;
  positiveCheck: boolean;
}>;

type PreferNullishCoalescingContext = Readonly<TSESLint.RuleContext<typeof MESSAGE_ID, []>>;

/**
 * Builds replacement text using the nullish coalescing operator.
 *
 * @param candidate - Nullish replacement candidate.
 * @param sourceCode - ESLint source code helper.
 * @returns Replacement expression text.
 */
function buildCoalesceText(
  candidate: NullishCandidate,
  sourceCode: Readonly<TSESLint.SourceCode>,
): string {
  return `${sourceCode.getText(candidate.expression)} ?? ${sourceCode.getText(candidate.fallback)}`;
}

/**
 * Checks one conditional expression for nullish-coalescing replacement.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Conditional expression node.
 */
function checkConditionalExpression(
  context: PreferNullishCoalescingContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.ConditionalExpression,
): void {
  const candidate = getNullishCandidate(node, sourceCode);
  if (candidate === null) {
    return;
  }
  context.report({
    node,
    messageId: MESSAGE_ID,
    fix: createConditionalExpressionFix(node, candidate, sourceCode),
  });
}

/**
 * Creates fixer callback for one conditional expression.
 *
 * @param node - Conditional expression node.
 * @param candidate - Nullish replacement candidate.
 * @param sourceCode - ESLint source code helper.
 * @returns ESLint fix callback.
 */
function createConditionalExpressionFix(
  node: TSESTree.ConditionalExpression,
  candidate: NullishCandidate,
  sourceCode: Readonly<TSESLint.SourceCode>,
): TSESLint.ReportFixFunction {
  return replaceWithCoalesce.bind(undefined, node, candidate, sourceCode);
}

/**
 * Creates listeners for prefer-nullish-coalescing rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createPreferNullishCoalescingListeners(
  context: PreferNullishCoalescingContext,
): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;
  return {
    ConditionalExpression: checkConditionalExpression.bind(undefined, context, sourceCode),
  };
}

/**
 * Compares two expressions by their source code text.
 *
 * @param first - First expression.
 * @param second - Second expression.
 * @param sourceCode - ESLint source code helper.
 * @returns True when expressions are textually equivalent.
 */
function expressionsMatch(
  first: TSESTree.Expression,
  second: TSESTree.Expression,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  return sourceCode.getText(first) === sourceCode.getText(second);
}

/**
 * Returns left-side nullish-check metadata.
 *
 * @param operator - Binary expression operator.
 * @param rightExpression - Right-side expression.
 * @returns Nullish-check metadata.
 */
function getLeftNullishCheck(operator: string, rightExpression: TSESTree.Expression): NullishCheck {
  return { expression: rightExpression, positiveCheck: operator === OPERATOR_LOOSE_NOT_EQUAL };
}

/**
 * Returns candidate information when a conditional expression mirrors a nullish guard.
 *
 * @param node - Conditional expression node.
 * @param sourceCode - ESLint source code helper.
 * @returns Nullish replacement candidate, or null.
 */
function getNullishCandidate(
  node: TSESTree.ConditionalExpression,
  sourceCode: Readonly<TSESLint.SourceCode>,
): NullishCandidate | null {
  if (node.test.type !== AST_NODE_TYPES.BinaryExpression) {
    return null;
  }
  const check = getNullishCheck(node.test);
  if (check === null) {
    return null;
  }
  const expressionBranch = getNullishExpressionBranch(node, check);
  if (!zCheckNullishBranchMatch(check.expression, expressionBranch, sourceCode)) {
    return null;
  }
  const fallback = zNullishFallbackBranch(node, check);
  return { expression: expressionBranch, fallback };
}

/**
 * Extracts guarded expression and check polarity from a nullish guard binary expression.
 *
 * @param node - Binary expression node.
 * @returns Nullish-check metadata, or null.
 */
function getNullishCheck(node: TSESTree.BinaryExpression): NullishCheck | null {
  if (!isLooseNullishOperator(node.operator)) {
    return null;
  }
  const leftExpression = toExpressionOperand(node.left);
  if (leftExpression === null) {
    return null;
  }
  return resolveNullishCheckFromLeft(node.operator, leftExpression, node.right);
}

/**
 * Returns the expression branch selected by nullish-check polarity.
 *
 * @param node - Conditional expression node.
 * @param check - Nullish-check metadata.
 * @returns Expression branch that should mirror the guarded expression.
 */
function getNullishExpressionBranch(
  node: TSESTree.ConditionalExpression,
  check: NullishCheck,
): TSESTree.Expression {
  return check.positiveCheck ? node.consequent : node.alternate;
}

/**
 * Returns right-side nullish-check metadata.
 *
 * @param node - Binary expression node.
 * @returns Nullish-check metadata, or null.
 */
function getRightNullishCheck(
  operator: string,
  leftExpression: TSESTree.Expression,
  rightOperand: TSESTree.Expression | TSESTree.PrivateIdentifier,
): NullishCheck | null {
  const rightExpression = toExpressionOperand(rightOperand);
  if (rightExpression === null || !isNullLiteral(rightExpression)) {
    return null;
  }
  return { expression: leftExpression, positiveCheck: operator === OPERATOR_LOOSE_NOT_EQUAL };
}

/**
 * Returns true when the node is the literal `null`.
 *
 * @param node - Expression node.
 * @returns True when node is a null literal.
 */
function isLooseNullishOperator(operator: string): boolean {
  return operator === OPERATOR_LOOSE_NOT_EQUAL || operator === OPERATOR_LOOSE_EQUAL;
}

/**
 * Returns true when operator is one of the loose nullish-comparison operators.
 *
 * @param operator - Binary operator token.
 * @returns True when operator is `==` or `!=`.
 */
function isNullLiteral(node: TSESTree.Expression): node is TSESTree.Literal {
  return node.type === AST_NODE_TYPES.Literal && node.value === null;
}

/**
 * Returns true when node is a private identifier.
 *
 * @param node - Candidate node.
 * @returns True when node is a private identifier.
 */
/**
 * Applies nullish-coalescing replacement for a conditional expression.
 *
 * @param node - Conditional expression node.
 * @param candidate - Nullish replacement candidate.
 * @param sourceCode - ESLint source code helper.
 * @param fixer - ESLint fixer.
 * @returns ESLint text replacement fix.
 */
function replaceWithCoalesce(
  node: TSESTree.ConditionalExpression,
  candidate: NullishCandidate,
  sourceCode: Readonly<TSESLint.SourceCode>,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  return fixer.replaceText(node, buildCoalesceText(candidate, sourceCode));
}

/**
 * Resolves nullish-check metadata based on the left operand value.
 *
 * @param operator - Binary expression operator.
 * @param leftExpression - Left-side expression.
 * @param rightOperand - Right-side operand.
 * @returns Nullish-check metadata, or null.
 */
function resolveNullishCheckFromLeft(
  operator: string,
  leftExpression: TSESTree.Expression,
  rightOperand: TSESTree.Expression | TSESTree.PrivateIdentifier,
): NullishCheck | null {
  if (!isNullLiteral(leftExpression)) {
    return getRightNullishCheck(operator, leftExpression, rightOperand);
  }
  const rightExpression = toExpressionOperand(rightOperand);
  return rightExpression === null ? null : getLeftNullishCheck(operator, rightExpression);
}

/**
 * Converts a binary operand into an expression when possible.
 *
 * @param operand - Binary expression operand.
 * @returns Expression operand, or null when operand is a private identifier.
 */
function toExpressionOperand(
  operand: TSESTree.Expression | TSESTree.PrivateIdentifier,
): TSESTree.Expression | null {
  return operand.type === AST_NODE_TYPES.PrivateIdentifier ? null : operand;
}

/**
 * Returns true when the guarded expression matches the selected conditional branch.
 *
 * @param expression - Guarded expression.
 * @param branch - Conditional branch expression.
 * @param sourceCode - ESLint source code helper.
 * @returns True when expressions are textually equivalent.
 */
function zCheckNullishBranchMatch(
  expression: TSESTree.Expression,
  branch: TSESTree.Expression,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  return expressionsMatch(expression, branch, sourceCode);
}

/**
 * Returns the fallback branch selected by nullish-check polarity.
 *
 * @param node - Conditional expression node.
 * @param check - Nullish-check metadata.
 * @returns Fallback branch expression.
 */
function zNullishFallbackBranch(
  node: TSESTree.ConditionalExpression,
  check: NullishCheck,
): TSESTree.Expression {
  return check.positiveCheck ? node.alternate : node.consequent;
}

/** Prefers nullish coalescing over null-check ternary expressions. */
export const preferNullishCoalescing = createRule({
  name: 'prefer-nullish-coalescing',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Prefer nullish coalescing instead of a nullish guard ternary',
    },
    messages: {
      [MESSAGE_ID]: 'Use nullish coalescing instead of this conditional expression',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferNullishCoalescingListeners,
});

export default preferNullishCoalescing;
