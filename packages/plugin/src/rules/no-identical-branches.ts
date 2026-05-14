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
import { createRule } from './support/rule-factory';

type NoIdenticalBranchesContext = Readonly<TSESLint.RuleContext<'noIdenticalBranches', []>>;

/**
 * Checks conditional expression branches for identical bodies.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - Conditional expression node.
 */
function checkConditionalExpression(
  context: Readonly<NoIdenticalBranchesContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.ConditionalExpression>,
): void {
  if (!hasSameBranchBody(node.consequent, node.alternate, sourceCode)) {
    return;
  }

  reportIdenticalBranches(context, node);
}

/**
 * Checks if-statement branches for identical bodies.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - If statement node.
 */
function checkIfStatement(
  context: Readonly<NoIdenticalBranchesContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.IfStatement>,
): void {
  if (node.alternate === null || isElseIfBranch(node.alternate)) {
    return;
  }
  if (!hasSameBranchBody(node.consequent, node.alternate, sourceCode)) {
    return;
  }

  reportIdenticalBranches(context, node);
}

/**
 * Creates listeners for identical-branch checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoIdenticalBranchesListeners(
  context: Readonly<NoIdenticalBranchesContext>,
): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;

  return {
    ConditionalExpression: checkConditionalExpression.bind(undefined, context, sourceCode),
    IfStatement: checkIfStatement.bind(undefined, context, sourceCode),
  };
}

/**
 * Returns true when two branches have identical source text.
 *
 * @param left - Left branch node.
 * @param right - Right branch node.
 * @param sourceCode - Source code helper.
 * @returns True if branches are textually identical.
 */
function hasSameBranchBody(
  left: Readonly<TSESTree.Node>,
  right: Readonly<TSESTree.Node>,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  return sourceCode.getText(left).trim() === sourceCode.getText(right).trim();
}

/**
 * Returns true when an if statement alternate is an `else if` chain.
 *
 * @param alternate - If statement alternate branch.
 * @returns True when the alternate is another if statement.
 */
function isElseIfBranch(alternate: TSESTree.Statement | null): boolean {
  return alternate?.type === AST_NODE_TYPES.IfStatement;
}

/**
 * Reports identical branch usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Node to report.
 */
function reportIdenticalBranches(
  context: Readonly<NoIdenticalBranchesContext>,
  node: Readonly<TSESTree.Node>,
): void {
  context.report({
    node,
    messageId: 'noIdenticalBranches',
  });
}

/** Disallows identical conditional branches that should be consolidated. */
export const noIdenticalBranches = createRule({
  name: 'no-identical-branches',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow identical if/else and conditional-expression branches; consolidate duplicate conditional fragments',
    },
    messages: {
      noIdenticalBranches:
        'Both conditional branches are identical; consolidate shared logic or simplify the conditional',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoIdenticalBranchesListeners,
});

export default noIdenticalBranches;
