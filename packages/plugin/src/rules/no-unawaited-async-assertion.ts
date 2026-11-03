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
import { isSupportedExpectCall } from './support/test-assertions';
import { isModuleImport, isNamedImport } from './support/test-imports';

const ASYNC_MODIFIERS = new Set([
  'resolves',
  'rejects',
  'eventually',
  'rejected',
  'fulfilled',
  'rejectedWith',
  'become',
]);
const CHAI_ASYNC_PROPERTIES = new Set([
  'rejected',
  'fulfilled',
  'true',
  'false',
  'ok',
  'exist',
  'empty',
  'null',
  'undefined',
]);
const NOTIFY_NAME = 'notify';
const VITEST_ASYNC_EXPECT_METHODS = new Set(['poll', 'element']);
const VOID_NAME = 'void';
const CHAI_MODULE = 'chai';
const ASSERT_NAME = 'assert';
const CHAI_ASYNC_ASSERT_METHODS = new Set([
  'isRejected',
  'isFulfilled',
  'becomes',
  'doesNotBecome',
]);
const EVENTUALLY_NAME = 'eventually';
type AsyncAssertionContext = Readonly<TSESLint.RuleContext<'unawaitedAsyncAssertion', []>>;

enum AssertionState {
  Async = 'async',
  Sync = 'sync',
}

/**
 * Reports a discarded asynchronous test assertion.
 *
 * @param context - Rule execution context.
 * @param node - Expression statement to inspect.
 */
function checkExpressionStatement(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.ExpressionStatement>,
): void {
  const expression = unwrapVoid(node.expression);
  if (!isUnawaitedAsyncAssertion(context, expression)) {
    return;
  }
  context.report({ node: expression, messageId: 'unawaitedAsyncAssertion' });
}

/**
 * Creates a listener only for test files.
 *
 * @param context - Rule execution context.
 * @returns Rule listeners.
 */
function createListeners(context: Readonly<AsyncAssertionContext>): TSESLint.RuleListener {
  if (!isTestFile(context.filename)) {
    return {};
  }
  return { ExpressionStatement: checkExpressionStatement.bind(undefined, context) };
}

/**
 * Checks a call within an assertion chain.
 *
 * @param context - Rule execution context.
 * @param node - Call expression to inspect.
 * @param state - Whether an async modifier was found.
 * @returns Whether the call completes a supported async assertion.
 */
function isAsyncAssertionCall(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
  state: Readonly<AssertionState>,
): boolean {
  if (isSupportedExpectCall(context, node)) {
    return state === AssertionState.Async || isVitestPollCall(node);
  }
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    isAsyncAssertionChain(context, node.callee, state)
  );
}

/**
 * Traces a matcher chain to an imported or global expect call.
 *
 * @param context - Rule execution context.
 * @param node - Current chain expression.
 * @param state - Whether the chain contains an async modifier.
 * @returns Whether this is a supported async assertion.
 */
function isAsyncAssertionChain(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.Expression>,
  state: Readonly<AssertionState>,
): boolean {
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return isAsyncAssertionMember(context, node, state);
  }
  return node.type === AST_NODE_TYPES.CallExpression && isAsyncAssertionCall(context, node, state);
}

/**
 * Checks a member within an assertion chain.
 *
 * @param context - Rule execution context.
 * @param node - Member expression to inspect.
 * @param state - Whether an async modifier was already found.
 * @returns Whether the member belongs to a supported async assertion.
 */
function isAsyncAssertionMember(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
  state: Readonly<AssertionState>,
): boolean {
  const modifier = ASYNC_MODIFIERS.has(getMemberPropertyName(node) ?? '');
  return isAsyncAssertionChain(context, node.object, modifier ? AssertionState.Async : state);
}

/**
 * Checks an asynchronous Chai assert call.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assert call.
 * @returns Whether the call returns an assertion promise.
 */
function isAsyncChaiAssertCall(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return (
    isChaiEventuallyReceiver(context, node.callee.object) ||
    isDirectAsyncChaiAssert(context, node.callee)
  );
}

/**
 * Checks a Chai assert receiver imported from chai.
 *
 * @param context - Rule execution context.
 * @param receiver - Assert method receiver.
 * @returns Whether Chai supplies the assert binding.
 */
function isChaiAssertReceiver(
  context: Readonly<AsyncAssertionContext>,
  receiver: Readonly<TSESTree.Expression>,
): boolean {
  if (receiver.type === AST_NODE_TYPES.Identifier) {
    return isNamedImport(context, receiver, CHAI_MODULE, ASSERT_NAME);
  }
  return receiver.type === AST_NODE_TYPES.MemberExpression && isChaiModuleAssert(context, receiver);
}

/**
 * Checks whether a Chai-as-promised property is a terminal assertion.
 *
 * @param node - Candidate terminal member.
 * @returns Whether the property itself performs an async assertion.
 */
function isChaiAsyncProperty(node: Readonly<TSESTree.MemberExpression>): boolean {
  return CHAI_ASYNC_PROPERTIES.has(getMemberPropertyName(node) ?? '');
}

/**
 * Traces a Chai assert.eventually chain to its assert binding.
 *
 * @param context - Rule execution context.
 * @param receiver - Matcher receiver.
 * @returns Whether eventually makes the assertion asynchronous.
 */
function isChaiEventuallyReceiver(
  context: Readonly<AsyncAssertionContext>,
  receiver: Readonly<TSESTree.Expression>,
): boolean {
  if (receiver.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  if (getMemberPropertyName(receiver) === EVENTUALLY_NAME) {
    return isChaiAssertReceiver(context, receiver.object);
  }
  return isChaiEventuallyReceiver(context, receiver.object);
}

/**
 * Checks Chai's namespace assert property.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assert member.
 * @returns Whether Chai owns the assert object.
 */
function isChaiModuleAssert(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === ASSERT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isModuleImport(context, node.object, CHAI_MODULE)
  );
}

/**
 * Checks a direct promise-specific Chai assert method.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assert method.
 * @returns Whether this Chai assert call is asynchronous.
 */
function isDirectAsyncChaiAssert(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    CHAI_ASYNC_ASSERT_METHODS.has(getMemberPropertyName(node) ?? '') &&
    isChaiAssertReceiver(context, node.object)
  );
}

/**
 * Checks whether a Chai-as-promised assertion notifies a completion callback.
 *
 * @param node - Candidate assertion call.
 * @returns Whether notify handles completion.
 */
function isNotifiedAssertion(node: Readonly<TSESTree.CallExpression>): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    getMemberPropertyName(node.callee) === NOTIFY_NAME &&
    node.arguments.length > 0
  );
}

/**
 * Checks a discarded expression for a known async assertion.
 *
 * @param context - Rule execution context.
 * @param node - Expression statement value.
 * @returns Whether an assertion promise is discarded.
 */
function isUnawaitedAsyncAssertion(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.Expression>,
): boolean {
  if (node.type === AST_NODE_TYPES.CallExpression) {
    return isUnawaitedCallAssertion(context, node);
  }
  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    isChaiAsyncProperty(node) &&
    isAsyncAssertionChain(context, node, AssertionState.Sync)
  );
}

/**
 * Checks a discarded async matcher call.
 *
 * @param context - Rule execution context.
 * @param node - Matcher call.
 * @returns Whether the assertion result is unhandled.
 */
function isUnawaitedCallAssertion(
  context: Readonly<AsyncAssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  return (
    !isSupportedExpectCall(context, node) &&
    !isNotifiedAssertion(node) &&
    (isAsyncAssertionChain(context, node, AssertionState.Sync) ||
      isAsyncChaiAssertCall(context, node))
  );
}

/**
 * Checks whether the root is Vitest's polling expect call.
 *
 * @param node - Supported expect call.
 * @returns Whether the call invokes expect.poll.
 */
function isVitestPollCall(node: Readonly<TSESTree.CallExpression>): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    VITEST_ASYNC_EXPECT_METHODS.has(getMemberPropertyName(node.callee) ?? '')
  );
}

/**
 * Unwraps an intentional void discard so it can still be checked.
 *
 * @param node - Expression statement value.
 * @returns Expression to inspect.
 */
function unwrapVoid(node: Readonly<TSESTree.Expression>): TSESTree.Expression {
  if (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === VOID_NAME) {
    return unwrapVoid(node.argument);
  }
  if (node.type === AST_NODE_TYPES.ChainExpression) {
    return unwrapVoid(node.expression);
  }
  return node;
}

/** Rule that requires async test assertions to be awaited or returned. */
export const noUnawaitedAsyncAssertion = createRule({
  name: 'no-unawaited-async-assertion',
  meta: {
    type: 'problem',
    docs: { description: 'Require asynchronous test assertions to be awaited or returned' },
    messages: {
      unawaitedAsyncAssertion:
        'Await or return this asynchronous assertion so the test waits for its result',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createListeners,
});

export default noUnawaitedAsyncAssertion;
