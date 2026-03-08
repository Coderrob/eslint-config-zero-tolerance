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
import { createRule } from '../rule-factory';

const CHECKED_BINARY_OPERATORS = new Set([
  '===',
  '!==',
  '==',
  '!=',
  '&&',
  '||',
  '??',
  '+',
  '-',
  '/',
  '%',
]);

type NoIdenticalExpressionsContext = Readonly<TSESLint.RuleContext<'identicalExpressions', []>>;

/**
 * Checks one binary/logical expression for identical operands.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - Expression node to inspect.
 */
function checkExpression(
  context: NoIdenticalExpressionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.BinaryExpression | TSESTree.LogicalExpression,
): void {
  if (!isCheckedOperator(node.operator)) {
    return;
  }
  if (
    !isExpressionNode(node.left) ||
    !hasIdenticalExpressionText(sourceCode, node.left, node.right)
  ) {
    return;
  }

  reportIdenticalExpression(context, node);
}

/**
 * Creates listeners that detect identical expressions.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoIdenticalExpressionsListeners(
  context: NoIdenticalExpressionsContext,
): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;

  return {
    BinaryExpression: checkExpression.bind(undefined, context, sourceCode),
    LogicalExpression: checkExpression.bind(undefined, context, sourceCode),
  };
}

/**
 * Returns true when both expression nodes have identical source text.
 *
 * @param sourceCode - Source code helper.
 * @param left - Left expression node.
 * @param right - Right expression node.
 * @returns True when both sides serialize to the same text.
 */
function hasIdenticalExpressionText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  left: TSESTree.Expression,
  right: TSESTree.Expression,
): boolean {
  const leftText = sourceCode.getText(left);
  const rightText = sourceCode.getText(right);
  return leftText === rightText;
}

/**
 * Returns true when the operator should be checked by this rule.
 *
 * @param operator - Binary or logical operator token.
 * @returns True when the operator is in the checked set.
 */
function isCheckedOperator(operator: string): boolean {
  return CHECKED_BINARY_OPERATORS.has(operator);
}

/**
 * Returns true when node is an ESTree expression (not a private identifier).
 *
 * @param node - Candidate node.
 * @returns True when node is an expression.
 */
function isExpressionNode(node: TSESTree.Node): node is TSESTree.Expression {
  return node.type !== AST_NODE_TYPES.PrivateIdentifier;
}

/**
 * Reports identical-expression violations.
 *
 * @param context - ESLint rule execution context.
 * @param node - Expression node to report.
 */
function reportIdenticalExpression(
  context: NoIdenticalExpressionsContext,
  node: TSESTree.BinaryExpression | TSESTree.LogicalExpression,
): void {
  context.report({
    node,
    messageId: 'identicalExpressions',
    data: { operator: node.operator },
  });
}

/**
 * ESLint rule that detects identical expressions in binary operations.
 */
export const noIdenticalExpressions = createRule({
  name: 'no-identical-expressions',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow identical expressions on both sides of a binary or logical operator (Sonar S1764)',
    },
    messages: {
      identicalExpressions:
        'Identical expressions on both sides of "{{operator}}" are always a bug; check for a copy-paste error',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoIdenticalExpressionsListeners,
});

export default noIdenticalExpressions;
