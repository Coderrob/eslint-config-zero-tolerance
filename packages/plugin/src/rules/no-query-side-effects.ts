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
import { type FunctionNode } from '../helpers/ast-guards';
import { getMemberPropertyName, resolveFunctionName } from '../helpers/ast-helpers';
import { createFunctionNodeEnterExitListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

const DELETE_OPERATOR = 'delete';
const UPDATE_KIND = 'update';
const ASSIGNMENT_KIND = 'assignment';
const QUERY_NAME_PATTERN = /^(get|is|has|can|should)[A-Z_]/;
const MUTATING_METHODS = new Set([
  'set',
  'add',
  'delete',
  'clear',
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
]);

type QueryScopeInfo = {
  isQuery: boolean;
  name: string;
};
type NoQuerySideEffectsContext = Readonly<TSESLint.RuleContext<'noQuerySideEffects', []>>;
type QueryScopeStack = QueryScopeInfo[];

/**
 * Checks assignment expressions for side effects.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @param node - Assignment expression node.
 */
function checkAssignmentExpression(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
  node: TSESTree.AssignmentExpression,
): void {
  reportIfQueryScope(context, functionStack, node, ASSIGNMENT_KIND);
}

/**
 * Checks call expressions for mutating method invocations.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
  node: TSESTree.CallExpression,
): void {
  const method = getMutatingMethodName(node);
  if (method === null) {
    return;
  }
  reportIfQueryScope(context, functionStack, node, `mutating call "${method}"`);
}

/**
 * Checks unary expressions for delete side effects.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @param node - Unary expression node.
 */
function checkUnaryExpression(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
  node: TSESTree.UnaryExpression,
): void {
  if (!isDeleteUnary(node)) {
    return;
  }
  reportIfQueryScope(context, functionStack, node, DELETE_OPERATOR);
}

/**
 * Checks update expressions for side effects.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @param node - Update expression node.
 */
function checkUpdateExpression(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
  node: TSESTree.UpdateExpression,
): void {
  reportIfQueryScope(context, functionStack, node, UPDATE_KIND);
}

/**
 * Creates assignment visitor bound to current rule state.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @returns Assignment expression visitor.
 */
function createAssignmentVisitor(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
): (node: TSESTree.AssignmentExpression) => void {
  return checkAssignmentExpression.bind(undefined, context, functionStack);
}

/**
 * Creates call-expression visitor bound to current rule state.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @returns Call expression visitor.
 */
function createCallVisitor(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
): (node: TSESTree.CallExpression) => void {
  return checkCallExpression.bind(undefined, context, functionStack);
}

/**
 * Creates the complete visitor map for this rule.
 *
 * @param context - Rule context.
 * @returns Rule listener map.
 */
function createNoQuerySideEffectsListeners(
  context: NoQuerySideEffectsContext,
): TSESLint.RuleListener {
  const functionStack: QueryScopeStack = [];
  return {
    ...createFunctionNodeEnterExitListeners(
      enterFunctionScope.bind(undefined, functionStack),
      exitFunctionScope.bind(undefined, functionStack),
    ),
    AssignmentExpression: createAssignmentVisitor(context, functionStack),
    CallExpression: createCallVisitor(context, functionStack),
    UnaryExpression: createUnaryVisitor(context, functionStack),
    UpdateExpression: createUpdateVisitor(context, functionStack),
  };
}

/**
 * Creates UnaryExpression visitor.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @returns Unary visitor.
 */
function createUnaryVisitor(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
): (node: TSESTree.UnaryExpression) => void {
  return checkUnaryExpression.bind(undefined, context, functionStack);
}

/**
 * Creates UpdateExpression visitor.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @returns Update visitor.
 */
function createUpdateVisitor(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
): (node: TSESTree.UpdateExpression) => void {
  return checkUpdateExpression.bind(undefined, context, functionStack);
}

/**
 * Pushes function metadata for query side-effect checks.
 *
 * @param functionStack - Function scope stack.
 * @param node - Function node entering scope.
 */
function enterFunctionScope(functionStack: QueryScopeStack, node: FunctionNode): void {
  const name = resolveFunctionName(node);
  functionStack.push({
    name,
    isQuery: isQueryName(name),
  });
}

/**
 * Pops active function scope metadata.
 *
 * @param functionStack - Function scope stack.
 * @param _node - Function node being exited.
 */
function exitFunctionScope(functionStack: QueryScopeStack, _node: FunctionNode): void {
  functionStack.pop();
}

/**
 * Returns active query scope info.
 *
 * @param functionStack - Function scope stack.
 * @returns Current scope info, or null.
 */
function getCurrentScope(functionStack: QueryScopeStack): QueryScopeInfo | null {
  return functionStack.at(-1) ?? null;
}

/**
 * Returns mutating method name when call expression is mutating.
 *
 * @param node - Call expression node.
 * @returns Method name if mutating, otherwise null.
 */
function getMutatingMethodName(node: TSESTree.CallExpression): string | null {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }
  const method = getMemberPropertyName(node.callee);
  if (method === null || !MUTATING_METHODS.has(method)) {
    return null;
  }
  return method;
}

/**
 * Returns true when unary expression uses delete.
 *
 * @param node - Unary expression node.
 * @returns True for delete unary expression.
 */
function isDeleteUnary(node: TSESTree.UnaryExpression): boolean {
  return node.operator === DELETE_OPERATOR;
}

/**
 * Returns true when function name follows query naming pattern.
 *
 * @param name - Function name.
 * @returns True for query-style names.
 */
function isQueryName(name: string): boolean {
  return QUERY_NAME_PATTERN.test(name);
}

/**
 * Reports side effects only when currently inside a query function.
 *
 * @param context - Rule context.
 * @param functionStack - Function scope stack.
 * @param node - Side-effecting AST node.
 * @param kind - Side effect kind label.
 */
function reportIfQueryScope(
  context: NoQuerySideEffectsContext,
  functionStack: QueryScopeStack,
  node: TSESTree.Node,
  kind: string,
): void {
  const current = getCurrentScope(functionStack);
  if (current === null || !current.isQuery) {
    return;
  }
  context.report({
    node,
    messageId: 'noQuerySideEffects',
    data: { name: current.name, kind },
  });
}

/** Disallows side effects in query-style functions. */
export const noQuerySideEffects = createRule({
  name: 'no-query-side-effects',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow side effects in query-style functions (get*/is*/has*/can*/should*); separate query from modifier',
    },
    messages: {
      noQuerySideEffects:
        'Query function "{{name}}" should not have side effects ({{kind}}); separate query from modifier',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoQuerySideEffectsListeners,
});

export default noQuerySideEffects;
