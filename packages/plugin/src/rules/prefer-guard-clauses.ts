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

const TERMINATOR_NODE_TYPES = new Set([
  AST_NODE_TYPES.ReturnStatement,
  AST_NODE_TYPES.ThrowStatement,
  AST_NODE_TYPES.ContinueStatement,
  AST_NODE_TYPES.BreakStatement,
]);

type PreferGuardClausesContext = Readonly<TSESLint.RuleContext<'preferGuardClauses', []>>;

/**
 * Reports else blocks that can be flattened into guard clauses.
 *
 * @param context - ESLint rule context.
 * @param node - If statement node.
 */
function checkIfStatement(
  context: Readonly<PreferGuardClausesContext>,
  node: Readonly<TSESTree.IfStatement>,
): void {
  if (!shouldReportElseBlock(node) || node.alternate === null) {
    return;
  }
  context.report({
    node: node.alternate,
    messageId: 'preferGuardClauses',
  });
}

/**
 * Creates the IfStatement checker visitor.
 *
 * @param context - ESLint rule context.
 * @returns IfStatement visitor callback.
 */
function createIfStatementChecker(
  context: Readonly<PreferGuardClausesContext>,
): (node: TSESTree.IfStatement) => void {
  return checkIfStatement.bind(null, context);
}

/**
 * Creates listeners for guard-clause checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createPreferGuardClausesListeners(
  context: Readonly<PreferGuardClausesContext>,
): TSESLint.RuleListener {
  return {
    IfStatement: createIfStatementChecker(context),
  };
}

/**
 * Returns true when the consequent branch ends with a terminator.
 *
 * @param consequent - If consequent statement.
 * @returns True when guard-clause style is applicable.
 */
function hasTerminatingConsequent(consequent: Readonly<TSESTree.Statement>): boolean {
  if (consequent.type === AST_NODE_TYPES.BlockStatement) {
    const last = consequent.body.at(-1);
    return last !== undefined && isTerminator(last);
  }
  return isTerminator(consequent);
}

/**
 * Returns true when a node is a control-flow terminator statement.
 *
 * @param node - Statement node to check.
 * @returns True when the statement terminates current branch flow.
 */
function isTerminator(node: Readonly<TSESTree.Statement>): boolean {
  return TERMINATOR_NODE_TYPES.has(node.type);
}

/**
 * Returns true when an if statement should report an avoidable else block.
 *
 * @param node - If statement node.
 * @returns True when guard-clause style should be used.
 */
function shouldReportElseBlock(node: Readonly<TSESTree.IfStatement>): boolean {
  if (node.alternate === null || node.alternate.type === AST_NODE_TYPES.IfStatement) {
    return false;
  }
  return hasTerminatingConsequent(node.consequent);
}

/** Prefers guard clauses over `else` blocks after terminating branches. */
export const preferGuardClauses = createRule({
  name: 'prefer-guard-clauses',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer guard clauses by disallowing else blocks when the if branch already terminates control flow',
    },
    messages: {
      preferGuardClauses:
        'Use a guard clause: remove this else block because the preceding if branch already terminates',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferGuardClausesListeners,
});

export default preferGuardClauses;
