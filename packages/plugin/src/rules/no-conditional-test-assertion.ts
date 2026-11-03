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
import { isTestFile } from '../helpers/ast-guards';
import { getMemberPropertyName } from '../helpers/ast-helpers';
import { createRule } from './support/rule-factory';
import { isSupportedAssertCall, isSupportedExpectCall } from './support/test-assertions';

const CATCH_NAME = 'catch';
const FUNCTION_TYPES = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);
const LOOP_TYPES = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.WhileStatement,
]);

type ConditionalAssertionContext = Readonly<TSESLint.RuleContext<'conditionalTestAssertion', []>>;

/**
 * Reports a supported assertion inside a conditional branch.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assertion call.
 */
function checkCallExpression(
  context: Readonly<ConditionalAssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!isConditionalBranch(node) || !isAssertionCall(context, node)) {
    return;
  }
  context.report({ node: node.callee, messageId: 'conditionalTestAssertion' });
}

/**
 * Creates a listener only for test files.
 *
 * @param context - Rule execution context.
 * @returns Rule listeners.
 */
function createListeners(context: Readonly<ConditionalAssertionContext>): TSESLint.RuleListener {
  if (!isTestFile(context.filename)) {
    return {};
  }
  return { CallExpression: checkCallExpression.bind(undefined, context) };
}

/**
 * Checks whether a supported assertion is invoked by a call.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assertion call.
 * @returns Whether the call starts or executes an assertion.
 */
function isAssertionCall(
  context: Readonly<ConditionalAssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  return (
    isSupportedAssertCall(context, node) ||
    (isSupportedExpectCall(context, node) && node.parent.type === AST_NODE_TYPES.MemberExpression)
  );
}

/**
 * Checks a catch body that may not run.
 *
 * @param parent - Candidate catch clause.
 * @param child - Node inside the clause.
 * @returns Whether the child is the catch body.
 */
function isCatchBody(parent: Readonly<TSESTree.Node>, child: Readonly<TSESTree.Node>): boolean {
  return parent.type === AST_NODE_TYPES.CatchClause && parent.body === child;
}

/**
 * Checks a promise catch callback that may not run.
 *
 * @param node - Function containing an assertion.
 * @returns Whether the function is a catch callback.
 */
function isCatchCallback(node: Readonly<TSESTree.Node>): boolean {
  const parent = node.parent;
  if (parent?.type !== AST_NODE_TYPES.CallExpression || !isCatchMethod(parent.callee)) {
    return false;
  }
  return parent.arguments.some((argument) => argument === node);
}

/**
 * Checks whether a callee invokes catch.
 *
 * @param callee - Candidate call target.
 * @returns Whether the target is a catch method.
 */
function isCatchMethod(callee: Readonly<TSESTree.Expression>): boolean {
  return (
    callee.type === AST_NODE_TYPES.MemberExpression && getMemberPropertyName(callee) === CATCH_NAME
  );
}

/**
 * Checks whether an assertion lies inside a branch that may not execute.
 *
 * @param node - Assertion call.
 * @returns Whether the assertion is conditional.
 */
function isConditionalBranch(node: Readonly<TSESTree.Node>): boolean {
  const parent = node.parent;
  if (parent == null) {
    return false;
  }
  if (isConditionalParent(parent, node)) {
    return true;
  }
  return FUNCTION_TYPES.has(parent.type) ? isCatchCallback(parent) : isConditionalBranch(parent);
}

/**
 * Checks all branch forms that can skip an assertion.
 *
 * @param parent - Candidate branching node.
 * @param child - Child containing the assertion.
 * @returns Whether this child is conditional.
 */
function isConditionalParent(
  parent: Readonly<TSESTree.Node>,
  child: Readonly<TSESTree.Node>,
): boolean {
  const checks = [
    isIfBranch,
    isTernaryBranch,
    isLogicalRight,
    isSwitchBody,
    isCatchBody,
    isLoopBody,
  ];
  return checks.some((check) => check(parent, child));
}

/**
 * Checks a for-of loop over an array with at least one fixed element.
 *
 * @param node - Candidate loop.
 * @returns Whether the loop body must execute at least once.
 */
function isGuaranteedNonemptyLoop(node: Readonly<TSESTree.Node>): boolean {
  return (
    node.type === AST_NODE_TYPES.ForOfStatement &&
    node.right.type === AST_NODE_TYPES.ArrayExpression &&
    node.right.elements.some(
      (element) => element !== null && element.type !== AST_NODE_TYPES.SpreadElement,
    )
  );
}

/**
 * Checks an if statement's optional branch.
 *
 * @param parent - Candidate if statement.
 * @param child - Child containing the assertion.
 * @returns Whether the child is a branch body.
 */
function isIfBranch(parent: Readonly<TSESTree.Node>, child: Readonly<TSESTree.Node>): boolean {
  return (
    parent.type === AST_NODE_TYPES.IfStatement &&
    (parent.consequent === child || parent.alternate === child)
  );
}

/**
 * Checks a short-circuit expression's optional right side.
 *
 * @param parent - Candidate logical expression.
 * @param child - Child containing the assertion.
 * @returns Whether the child is the right operand.
 */
function isLogicalRight(parent: Readonly<TSESTree.Node>, child: Readonly<TSESTree.Node>): boolean {
  return parent.type === AST_NODE_TYPES.LogicalExpression && parent.right === child;
}

/**
 * Checks a loop body that may execute zero times.
 *
 * @param parent - Candidate loop statement.
 * @param child - Child containing the assertion.
 * @returns Whether the child is the loop body.
 */
function isLoopBody(parent: Readonly<TSESTree.Node>, child: Readonly<TSESTree.Node>): boolean {
  return (
    LOOP_TYPES.has(parent.type) &&
    Reflect.get(parent, 'body') === child &&
    !isGuaranteedNonemptyLoop(parent)
  );
}

/**
 * Checks a switch case body.
 *
 * @param parent - Candidate switch case.
 * @param child - Child containing the assertion.
 * @returns Whether the child is a case statement.
 */
function isSwitchBody(parent: Readonly<TSESTree.Node>, child: Readonly<TSESTree.Node>): boolean {
  return (
    parent.type === AST_NODE_TYPES.SwitchCase &&
    parent.consequent.some((statement) => statement === child)
  );
}

/**
 * Checks an optional ternary branch.
 *
 * @param parent - Candidate conditional expression.
 * @param child - Child containing the assertion.
 * @returns Whether the child is a ternary outcome.
 */
function isTernaryBranch(parent: Readonly<TSESTree.Node>, child: Readonly<TSESTree.Node>): boolean {
  return (
    parent.type === AST_NODE_TYPES.ConditionalExpression &&
    (parent.consequent === child || parent.alternate === child)
  );
}

/** Rule that requires test assertions to run on every applicable path. */
export const noConditionalTestAssertion = createRule({
  name: 'no-conditional-test-assertion',
  meta: {
    type: 'problem',
    docs: { description: 'Disallow assertions in test branches that may not execute' },
    messages: {
      conditionalTestAssertion:
        'Move this assertion onto a path that always executes, or split the cases into separate tests',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createListeners,
});

export default noConditionalTestAssertion;
