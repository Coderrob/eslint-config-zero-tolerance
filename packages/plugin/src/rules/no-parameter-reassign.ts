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
import type { FunctionNode } from '../ast-guards';
import { createRule } from '../rule-factory';

type NoParameterReassignContext = Readonly<TSESLint.RuleContext<'noParameterReassign', []>>;
type ParameterScopeStack = Array<Set<string>>;

/**
 * Checks assignment expressions for direct parameter reassignment.
 *
 * @param context - ESLint rule execution context.
 * @param parameterStack - Nested function parameter stack.
 * @param node - Assignment expression node.
 */
function checkAssignmentExpression(
  context: NoParameterReassignContext,
  parameterStack: ParameterScopeStack,
  node: TSESTree.AssignmentExpression,
): void {
  if (node.left.type !== AST_NODE_TYPES.Identifier) {
    return;
  }
  reportIfParameterReassigned(context, parameterStack, node.left);
}

/**
 * Checks update expressions for parameter reassignment.
 *
 * @param context - ESLint rule execution context.
 * @param parameterStack - Nested function parameter stack.
 * @param node - Update expression node.
 */
function checkUpdateExpression(
  context: NoParameterReassignContext,
  parameterStack: ParameterScopeStack,
  node: TSESTree.UpdateExpression,
): void {
  if (node.argument.type !== AST_NODE_TYPES.Identifier) {
    return;
  }
  reportIfParameterReassigned(context, parameterStack, node.argument);
}

/**
 * Creates listeners that detect parameter reassignments.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoParameterReassignListeners(
  context: NoParameterReassignContext,
): TSESLint.RuleListener {
  const parameterStack: ParameterScopeStack = [];
  return {
    ArrowFunctionExpression: enterFunctionScope.bind(undefined, parameterStack),
    'ArrowFunctionExpression:exit': exitFunctionScope.bind(undefined, parameterStack),
    AssignmentExpression: checkAssignmentExpression.bind(undefined, context, parameterStack),
    FunctionDeclaration: enterFunctionScope.bind(undefined, parameterStack),
    'FunctionDeclaration:exit': exitFunctionScope.bind(undefined, parameterStack),
    FunctionExpression: enterFunctionScope.bind(undefined, parameterStack),
    'FunctionExpression:exit': exitFunctionScope.bind(undefined, parameterStack),
    UpdateExpression: checkUpdateExpression.bind(undefined, context, parameterStack),
  };
}

/**
 * Pushes a parameter scope for a function node.
 *
 * @param parameterStack - Nested function parameter stack.
 * @param node - Function node being entered.
 */
function enterFunctionScope(parameterStack: ParameterScopeStack, node: FunctionNode): void {
  parameterStack.push(getFunctionParameterNames(node));
}

/**
 * Pops the current function parameter scope.
 *
 * @param parameterStack - Nested function parameter stack.
 */
function exitFunctionScope(parameterStack: ParameterScopeStack): void {
  parameterStack.pop();
}

/**
 * Returns identifier name for assignment-pattern parameters.
 *
 * @param param - Function parameter node.
 * @returns Identifier name when assignment-pattern parameter is supported.
 */
function getAssignmentPatternParameterName(param: TSESTree.Parameter): string | null {
  if (param.type !== AST_NODE_TYPES.AssignmentPattern) {
    return null;
  }
  return param.left.type === AST_NODE_TYPES.Identifier ? param.left.name : null;
}

/**
 * Creates a set of parameter names for one function scope.
 *
 * @param node - Function node to inspect.
 * @returns Set of parameter identifiers in that function signature.
 */
function getFunctionParameterNames(node: FunctionNode): Set<string> {
  const names = new Set<string>();
  for (const param of node.params) {
    const name = getParameterName(param);
    if (name !== null) {
      names.add(name);
    }
  }
  return names;
}

/**
 * Returns identifier name for supported parameter shapes.
 *
 * @param param - Function parameter node.
 * @returns Parameter name when resolvable, otherwise null.
 */
function getParameterName(param: TSESTree.Parameter): string | null {
  if (param.type === AST_NODE_TYPES.Identifier) {
    return param.name;
  }
  const restElementName = getRestElementParameterName(param);
  if (restElementName !== null) {
    return restElementName;
  }
  return getAssignmentPatternParameterName(param);
}

/**
 * Returns identifier name for rest-element parameters.
 *
 * @param param - Function parameter node.
 * @returns Identifier name when rest-element parameter is supported.
 */
function getRestElementParameterName(param: TSESTree.Parameter): string | null {
  if (param.type !== AST_NODE_TYPES.RestElement) {
    return null;
  }
  return param.argument.type === AST_NODE_TYPES.Identifier ? param.argument.name : null;
}

/**
 * Reports parameter reassignment when identifier belongs to current scope.
 *
 * @param context - ESLint rule execution context.
 * @param parameterStack - Nested function parameter stack.
 * @param node - Identifier node assigned or updated.
 */
function reportIfParameterReassigned(
  context: NoParameterReassignContext,
  parameterStack: ParameterScopeStack,
  node: TSESTree.Identifier,
): void {
  const currentScope = parameterStack.at(-1);
  if (currentScope === undefined || !currentScope.has(node.name)) {
    return;
  }
  context.report({
    node,
    messageId: 'noParameterReassign',
    data: { name: node.name },
  });
}

/** Disallows reassigning function parameters. */
export const noParameterReassign = createRule({
  name: 'no-parameter-reassign',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow assignments and updates to function parameters; use a new local variable instead',
    },
    messages: {
      noParameterReassign:
        'Parameter "{{name}}" is reassigned; use a new variable (refactoring: Split Variable / Remove Assignments to Parameters)',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoParameterReassignListeners,
});

export default noParameterReassign;
