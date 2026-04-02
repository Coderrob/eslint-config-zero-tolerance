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
import { isIdentifierNode } from '../helpers/ast-guards';
import { getCallMemberMethodName } from '../helpers/ast-helpers';
import { createRule } from './support/rule-factory';

const PROMISE_CHAIN_METHODS = new Set(['then', 'catch', 'finally']);
const PROMISE_STATIC_METHODS = new Set(['resolve', 'reject', 'all', 'allSettled', 'race', 'any']);
const VOID_OPERATOR = 'void';
const PROMISE_IDENTIFIER = 'Promise';
const CATCH_METHOD = 'catch';
const THEN_METHOD = 'then';

type NoFloatingPromisesContext = Readonly<TSESLint.RuleContext<'noFloatingPromises', []>>;

/**
 * Checks expression statements and reports floating promises.
 *
 * @param context - ESLint rule execution context.
 * @param node - Expression statement to inspect.
 */
function checkExpressionStatement(
  context: NoFloatingPromisesContext,
  node: TSESTree.ExpressionStatement,
): void {
  if (isHandledPromiseExpression(node.expression)) {
    return;
  }
  if (!isPromiseLikeExpression(node.expression)) {
    return;
  }
  context.report({ node: node.expression, messageId: 'noFloatingPromises' });
}

/**
 * Creates listeners for no-floating-promises rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoFloatingPromisesListeners(
  context: NoFloatingPromisesContext,
): TSESLint.RuleListener {
  return {
    ExpressionStatement: checkExpressionStatement.bind(undefined, context),
  };
}

/**
 * Returns chained object call when callee is a member call on another call.
 *
 * @param node - Call expression node.
 * @returns Parent call expression in chain, or null.
 */
function getChainedObjectCall(node: TSESTree.CallExpression): TSESTree.CallExpression | null {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }
  if (node.callee.object.type !== AST_NODE_TYPES.CallExpression) {
    return null;
  }
  return node.callee.object;
}

/**
 * Returns true when a call chain includes `catch(handler)` or `then(_, handler)`.
 *
 * @param node - Call expression to inspect.
 * @returns True when rejection is handled in the chain.
 */
function hasRejectionHandlerInChain(node: TSESTree.CallExpression): boolean {
  if (isCatchWithHandler(node) || isThenWithRejectionHandler(node)) {
    return true;
  }
  const chainedCall = getChainedObjectCall(node);
  return chainedCall === null ? false : hasRejectionHandlerInChain(chainedCall);
}

/**
 * Returns true when call expression is an async IIFE invocation.
 *
 * @param node - Call expression node.
 * @returns True when invoking an async function expression immediately.
 */
function isAsyncIifeCall(node: TSESTree.CallExpression): boolean {
  if (
    node.callee.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    node.callee.type !== AST_NODE_TYPES.FunctionExpression
  ) {
    return false;
  }
  return node.callee.async;
}

/**
 * Returns true when call expression is `catch(handler)`.
 *
 * @param node - Call expression node.
 * @returns True when catch has at least one handler argument.
 */
function isCatchWithHandler(node: TSESTree.CallExpression): boolean {
  return getCallMemberMethodName(node) === CATCH_METHOD && node.arguments.length > 0;
}

/**
 * Returns true when call expression has explicit rejection handling.
 *
 * @param expression - Expression to inspect.
 * @returns True when expression is a handled promise chain.
 */
function isHandledPromiseChainExpression(expression: TSESTree.Expression): boolean {
  if (expression.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  return hasRejectionHandlerInChain(expression);
}

/**
 * Returns true when expression has explicit promise handling.
 *
 * @param expression - Expression to inspect.
 * @returns True when expression handles promise rejection.
 */
function isHandledPromiseExpression(expression: TSESTree.Expression): boolean {
  return (
    expression.type === AST_NODE_TYPES.AwaitExpression ||
    isHandledVoidPromiseExpression(expression) ||
    isHandledPromiseChainExpression(expression)
  );
}

/**
 * Returns true when expression is `void <promise-like-expression>`.
 *
 * @param expression - Expression to inspect.
 * @returns True for intentional fire-and-forget promise expressions.
 */
function isHandledVoidPromiseExpression(expression: TSESTree.Expression): boolean {
  if (expression.type !== AST_NODE_TYPES.UnaryExpression) {
    return false;
  }
  if (expression.operator !== VOID_OPERATOR) {
    return false;
  }
  return isPromiseLikeExpression(expression.argument);
}

/**
 * Returns true when call expression is a promise-chain method call.
 *
 * @param node - Call expression node.
 * @returns True for then/catch/finally calls.
 */
function isPromiseChainCall(node: TSESTree.CallExpression): boolean {
  const method = getCallMemberMethodName(node);
  return method !== null && PROMISE_CHAIN_METHODS.has(method);
}

/**
 * Returns true when expression is `new Promise(...)`.
 *
 * @param expression - Expression to inspect.
 * @returns True for Promise constructor expressions.
 */
function isPromiseConstructorExpression(expression: TSESTree.Expression): boolean {
  if (expression.type !== AST_NODE_TYPES.NewExpression) {
    return false;
  }
  return isIdentifierNode(expression.callee) && expression.callee.name === PROMISE_IDENTIFIER;
}

/**
 * Returns true when a call expression appears to produce a promise.
 *
 * @param expression - Expression to inspect.
 * @returns True when call expression is promise-like.
 */
function isPromiseLikeCallExpression(expression: TSESTree.Expression): boolean {
  if (expression.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  return (
    isAsyncIifeCall(expression) || isPromiseChainCall(expression) || isPromiseStaticCall(expression)
  );
}

/**
 * Returns true when an expression appears to produce a promise.
 *
 * @param expression - Expression to inspect.
 * @returns True when expression is promise-like.
 */
function isPromiseLikeExpression(expression: TSESTree.Expression): boolean {
  if (expression.type === AST_NODE_TYPES.ImportExpression) {
    return true;
  }
  if (isPromiseConstructorExpression(expression)) {
    return true;
  }
  return isPromiseLikeCallExpression(expression);
}

/**
 * Returns true when call expression is Promise.<method>(...).
 *
 * @param node - Call expression node.
 * @returns True for known Promise static methods.
 */
function isPromiseStaticCall(node: TSESTree.CallExpression): boolean {
  const method = getCallMemberMethodName(node);
  return (
    method !== null && PROMISE_STATIC_METHODS.has(method) && isPromiseStaticCallee(node.callee)
  );
}

/**
 * Returns true when callee is a Promise member expression.
 *
 * @param callee - Call expression callee node.
 * @returns True when callee object is Promise.
 */
function isPromiseStaticCallee(callee: TSESTree.Expression): boolean {
  return (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    isIdentifierNode(callee.object) &&
    callee.object.name === PROMISE_IDENTIFIER
  );
}

/**
 * Returns true when call expression is `then(onFulfilled, onRejected)`.
 *
 * @param node - Call expression node.
 * @returns True when then has a rejection handler.
 */
function isThenWithRejectionHandler(node: TSESTree.CallExpression): boolean {
  return getCallMemberMethodName(node) === THEN_METHOD && node.arguments.length > 1;
}

/**
 * ESLint rule that disallows floating promises without explicit handling.
 */
export const noFloatingPromises = createRule({
  name: 'no-floating-promises',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow floating promises; explicitly handle with await, void, or rejection handlers',
    },
    messages: {
      noFloatingPromises:
        'Unhandled promise detected; use await, void, .catch(...), or then(..., onRejected)',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoFloatingPromisesListeners,
});

export default noFloatingPromises;
