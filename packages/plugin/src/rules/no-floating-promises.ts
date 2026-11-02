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
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import type ts from 'typescript';
import { isMemberExpressionNode, isNamedIdentifierNode } from '../helpers/ast-guards';
import { getCallMemberMethodName } from '../helpers/ast-helpers';
import { createRule } from './support/rule-factory';

const PROMISE_CHAIN_METHODS = new Set(['then', 'catch', 'finally']);
const PROMISE_STATIC_METHODS = new Set(['resolve', 'reject', 'all', 'allSettled', 'race', 'any']);
const VOID_OPERATOR = 'void';
const PROMISE_IDENTIFIER = 'Promise';
const CATCH_METHOD = 'catch';
const THEN_METHOD = 'then';
const REJECT_METHOD = 'reject';
const WITH_SCOPE_TYPE = 'with';
const FUNCTION_DEFINITION_TYPE = 'FunctionName';
const UNDEFINED_IDENTIFIER = 'undefined';
const INLINE_FUNCTION_TYPES = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
]);
const CALLBACK_REFERENCE_TYPES = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.MemberExpression,
  ...INLINE_FUNCTION_TYPES,
]);

type NoFloatingPromisesContext = Readonly<TSESLint.RuleContext<'noFloatingPromises', []>>;

/**
 * Checks expression statements and reports floating promises.
 *
 * @param context - ESLint rule execution context.
 * @param node - Expression statement to inspect.
 */
function checkExpressionStatement(
  context: Readonly<NoFloatingPromisesContext>,
  node: Readonly<TSESTree.ExpressionStatement>,
): void {
  if (isHandledPromiseExpression(node.expression)) {
    return;
  }
  if (!isPromiseLikeExpression(context, node.expression)) {
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
  context: Readonly<NoFloatingPromisesContext>,
): TSESLint.RuleListener {
  return {
    ExpressionStatement: checkExpressionStatement.bind(undefined, context),
  };
}

/**
 * Checks both outcomes of a conditional callback statement.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function hasConditionalRejection(node: Readonly<TSESTree.IfStatement>): boolean {
  return hasVisibleRejection(node.consequent) || hasOptionalRejection(node.alternate);
}

/**
 * Checks an optional statement or returned expression for a visible rejection.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function hasOptionalRejection(node: TSESTree.Node | null): boolean {
  return node !== null && hasVisibleRejection(node);
}

/**
 * Checks supported statement branches without entering nested function bodies.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function hasStatementRejection(node: Readonly<TSESTree.Node>): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.BlockStatement:
      return node.body.some(hasVisibleRejection);
    case AST_NODE_TYPES.ReturnStatement:
      return hasOptionalRejection(node.argument);
    case AST_NODE_TYPES.IfStatement:
      return hasConditionalRejection(node);
    default:
      return false;
  }
}

/**
 * Returns true when the terminal call supplies a usable rejection handler.
 *
 * @param node - Call expression to inspect.
 * @returns True when the last call handles rejection.
 */
function hasTerminalRejectionHandler(node: Readonly<TSESTree.CallExpression>): boolean {
  return isCatchWithHandler(node) || isThenWithRejectionHandler(node);
}

/**
 * Finds throws in a callback body while excluding nested functions that are not executed here.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function hasVisibleRejection(node: Readonly<TSESTree.Node>): boolean {
  if (node.type === AST_NODE_TYPES.ThrowStatement) return true;
  if (node.type === AST_NODE_TYPES.CallExpression) return isExplicitRejectedCall(node);
  return hasStatementRejection(node);
}

/**
 * Finds the nearest binding and checks its declaration rather than matching names globally.
 *
 * @param scope - Lexical scope containing the expression.
 * @param name - Binding name to resolve.
 * @returns Whether the candidate satisfies this check.
 */
function isAsyncBinding(scope: TSESLint.Scope.Scope | null, name: string): boolean {
  if (scope === null) return false;
  if (scope.type === WITH_SCOPE_TYPE) return false;
  const binding = scope.set.get(name);
  return binding === undefined ? isAsyncBinding(scope.upper, name) : isStableAsyncBinding(binding);
}

/**
 * Checks declarations for promise-producing async functions.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isAsyncDeclaration(node: Readonly<TSESTree.Node>): boolean {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) return node.async && !node.generator;
  return isAsyncFunction(node);
}

/**
 * Checks function declarations and initialized function variables for the async modifier.
 *
 * @param definition - Binding declaration to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isAsyncDefinition(definition: Readonly<TSESLint.Scope.Definition>): boolean {
  const node = definition.node;
  if (definition.type === FUNCTION_DEFINITION_TYPE) return isAsyncDeclaration(node);
  return node.type === AST_NODE_TYPES.VariableDeclarator && isAsyncFunction(node.init);
}

/**
 * Recognizes async functions that return promises rather than async iterators.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isAsyncFunction(node: TSESTree.Node | null): boolean {
  if (!isInlineFunction(node)) return false;
  return node.async && !node.generator;
}

/**
 * Returns true when call expression is an async IIFE invocation.
 *
 * @param node - Call expression node.
 * @returns True when invoking an async function expression immediately.
 */
function isAsyncIifeCall(node: Readonly<TSESTree.CallExpression>): boolean {
  if (
    node.callee.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    node.callee.type !== AST_NODE_TYPES.FunctionExpression
  ) {
    return false;
  }
  return node.callee.async && !node.callee.generator;
}

/**
 * Identifies writes after a binding's declaration.
 *
 * @param reference - Scope reference that may overwrite a value.
 * @returns Whether the candidate satisfies this check.
 */
function isBindingOverwrite(reference: Readonly<TSESLint.Scope.Reference>): boolean {
  return reference.isWrite() && !Object.is(reference.init, true);
}

/**
 * Requires a callback reference or function rather than an absent or literal argument.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isCallbackExpression(node: TSESTree.CallExpressionArgument | undefined): boolean {
  if (node === undefined) return false;
  if (node.type === AST_NODE_TYPES.Identifier) return node.name !== UNDEFINED_IDENTIFIER;
  return CALLBACK_REFERENCE_TYPES.has(node.type);
}

/**
 * Returns true when call expression is `catch(handler)`.
 *
 * @param node - Call expression node.
 * @returns True when catch has at least one handler argument.
 */
function isCatchWithHandler(node: Readonly<TSESTree.CallExpression>): boolean {
  return getCallMemberMethodName(node) === CATCH_METHOD && isUsableHandler(node.arguments[0]);
}

/**
 * Checks syntactically explicit promise producers before local binding inference.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isExplicitPromiseCall(node: Readonly<TSESTree.CallExpression>): boolean {
  return isAsyncIifeCall(node) || isPromiseChainCall(node) || isPromiseStaticCall(node);
}

/**
 * Recognizes a directly returned Promise.reject call.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isExplicitRejectedCall(node: Readonly<TSESTree.CallExpression>): boolean {
  return isPromiseStaticCall(node) && getCallMemberMethodName(node) === REJECT_METHOD;
}

/**
 * Returns true when call expression has explicit rejection handling.
 *
 * @param expression - Expression to inspect.
 * @returns True when expression is a handled promise chain.
 */
function isHandledPromiseChainExpression(expression: Readonly<TSESTree.Expression>): boolean {
  if (expression.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  return hasTerminalRejectionHandler(expression);
}

/**
 * Returns true when expression has explicit promise handling.
 *
 * @param expression - Expression to inspect.
 * @returns True when expression handles promise rejection.
 */
function isHandledPromiseExpression(expression: Readonly<TSESTree.Expression>): boolean {
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
function isHandledVoidPromiseExpression(expression: Readonly<TSESTree.Expression>): boolean {
  if (expression.type !== AST_NODE_TYPES.UnaryExpression) {
    return false;
  }
  return !(expression.operator !== VOID_OPERATOR);
}

/**
 * Narrows a callback to a direct function expression without traversing nested declarations.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isInlineFunction(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  if (node === null || node === undefined) return false;
  return INLINE_FUNCTION_TYPES.has(node.type);
}

/**
 * Resolves local async calls through their lexical binding, ignoring overwritten functions.
 *
 * @param context - ESLint execution context.
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isLocalAsyncCall(
  context: Readonly<NoFloatingPromisesContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  return isAsyncBinding(context.sourceCode.getScope(node), node.callee.name);
}

/**
 * Returns true when call expression is a promise-chain method call.
 *
 * @param node - Call expression node.
 * @returns True for then/catch/finally calls.
 */
function isPromiseChainCall(node: Readonly<TSESTree.CallExpression>): boolean {
  const method = getCallMemberMethodName(node);
  return method !== null && PROMISE_CHAIN_METHODS.has(method);
}

/**
 * Returns true when expression is `new Promise(...)`.
 *
 * @param expression - Expression to inspect.
 * @returns True for Promise constructor expressions.
 */
function isPromiseConstructorExpression(expression: Readonly<TSESTree.Expression>): boolean {
  if (expression.type !== AST_NODE_TYPES.NewExpression) {
    return false;
  }
  return isNamedIdentifierNode(expression.callee, PROMISE_IDENTIFIER);
}

/**
 * Returns true when a call expression appears to produce a promise.
 *
 * @param context - ESLint execution context.
 * @param expression - Candidate expression.
 * @returns Whether the candidate satisfies this check.
 */
function isPromiseLikeCallExpression(
  context: Readonly<NoFloatingPromisesContext>,
  expression: Readonly<TSESTree.Expression>,
): boolean {
  if (expression.type !== AST_NODE_TYPES.CallExpression) return false;
  return isExplicitPromiseCall(expression) || isLocalAsyncCall(context, expression);
}

/**
 * Returns true when an expression appears to produce a promise.
 *
 * @param context - ESLint execution context.
 * @param expression - Candidate expression.
 * @returns Whether the candidate satisfies this check.
 */
function isPromiseLikeExpression(
  context: Readonly<NoFloatingPromisesContext>,
  expression: Readonly<TSESTree.Expression>,
): boolean {
  if (expression.type === AST_NODE_TYPES.ImportExpression) {
    return true;
  }
  if (isPromiseConstructorExpression(expression)) {
    return true;
  }
  return (
    isPromiseLikeCallExpression(context, expression) ||
    isTypedPromiseExpression(context, expression)
  );
}

/**
 * Returns true when call expression is Promise.<method>(...).
 *
 * @param node - Call expression node.
 * @returns True for known Promise static methods.
 */
function isPromiseStaticCall(node: Readonly<TSESTree.CallExpression>): boolean {
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
function isPromiseStaticCallee(callee: Readonly<TSESTree.Expression>): boolean {
  return isMemberExpressionNode(callee) && isNamedIdentifierNode(callee.object, PROMISE_IDENTIFIER);
}

/**
 * Excludes bindings whose callable value has been overwritten after initialization.
 *
 * @param binding - Resolved variable and its write references.
 * @returns Whether the candidate satisfies this check.
 */
function isStableAsyncBinding(binding: Readonly<TSESLint.Scope.Variable>): boolean {
  return !binding.references.some(isBindingOverwrite) && binding.defs.some(isAsyncDefinition);
}

/**
 * Checks union members for callable then properties without treating arbitrary values as promises.
 *
 * @param checker - TypeScript checker for the current program.
 * @param type - Resolved expression type.
 * @returns Whether the candidate satisfies this check.
 */
function isThenableType(checker: Readonly<ts.TypeChecker>, type: Readonly<ts.Type>): boolean {
  if (type.isUnion()) {
    return type.types.some(isThenableType.bind(undefined, checker));
  }
  const then = type.getProperty('then');
  if (then === undefined || then.valueDeclaration === undefined) {
    return false;
  }
  const declaration = then.valueDeclaration;
  return checker.getTypeOfSymbolAtLocation(then, declaration).getCallSignatures().length > 0;
}

/**
 * Returns true when call expression is `then(onFulfilled, onRejected)`.
 *
 * @param node - Call expression node.
 * @returns True when then has a rejection handler.
 */
function isThenWithRejectionHandler(node: Readonly<TSESTree.CallExpression>): boolean {
  return (
    getCallMemberMethodName(node) === THEN_METHOD &&
    isUsableHandler(node.arguments[1]) &&
    !isUnsafeInlineHandler(node.arguments[0])
  );
}

/**
 * Uses optional TypeScript services to recognize promises from imported calls and values.
 *
 * @param context - ESLint execution context.
 * @param expression - Candidate expression.
 * @returns Whether the candidate satisfies this check.
 */
function isTypedPromiseExpression(
  context: Readonly<NoFloatingPromisesContext>,
  expression: Readonly<TSESTree.Expression>,
): boolean {
  try {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(expression));
    return isThenableType(checker, type);
  } catch {
    return false;
  }
}

/**
 * Rejects inline handlers that visibly throw or produce another asynchronous rejection.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isUnsafeInlineHandler(node: TSESTree.CallExpressionArgument | undefined): boolean {
  if (!isInlineFunction(node)) return false;
  if (node.generator) return false;
  return node.async || hasVisibleRejection(node.body);
}

/**
 * Requires an actual callback reference or inline function at the rejection-handler position.
 *
 * @param node - AST node to inspect.
 * @returns Whether the candidate satisfies this check.
 */
function isUsableHandler(node: TSESTree.CallExpressionArgument | undefined): boolean {
  return isCallbackExpression(node) && !isUnsafeInlineHandler(node);
}

/**
 * ESLint rule that disallows floating promises without explicit handling.
 */
export const noFloatingPromises = createRule({
  name: 'no-floating-promises',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require handling of explicit, local async, and type-resolved promises',
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
