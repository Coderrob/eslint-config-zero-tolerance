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
import type { FunctionNode } from '../helpers/ast-guards';
import { getNamedParameterName } from '../helpers/parameter-helpers';
import { createFunctionNodeEnterExitListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

type NoParameterReassignContext = Readonly<TSESLint.RuleContext<'noParameterReassign', []>>;
type ParameterScopeStack = Array<ReadonlySet<string>>;

/**
 * Checks assignment expressions for direct parameter reassignment.
 *
 * @param context - ESLint rule execution context.
 * @param parameterStack - Nested function parameter stack.
 * @param node - Assignment expression node.
 */
function checkAssignmentExpression(
  context: Readonly<NoParameterReassignContext>,
  parameterStack: Readonly<ParameterScopeStack>,
  node: Readonly<TSESTree.AssignmentExpression>,
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
  context: Readonly<NoParameterReassignContext>,
  parameterStack: Readonly<ParameterScopeStack>,
  node: Readonly<TSESTree.UpdateExpression>,
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
  context: Readonly<NoParameterReassignContext>,
): TSESLint.RuleListener {
  const parameterStack: ParameterScopeStack = [];
  return {
    ...createFunctionNodeEnterExitListeners(
      enterFunctionScope.bind(undefined, parameterStack),
      exitFunctionScope.bind(undefined, parameterStack),
    ),
    AssignmentExpression: checkAssignmentExpression.bind(undefined, context, parameterStack),
    UpdateExpression: checkUpdateExpression.bind(undefined, context, parameterStack),
  };
}

/**
 * Pushes a parameter scope for a function node.
 *
 * @param parameterStack - Nested function parameter stack.
 * @param node - Function node being entered.
 */
function enterFunctionScope(
  parameterStack: Readonly<ParameterScopeStack>,
  node: Readonly<FunctionNode>,
): void {
  Reflect.apply(Array.prototype.push, parameterStack, [getFunctionParameterNames(node)]);
}

/**
 * Pops the current function parameter scope.
 *
 * @param parameterStack - Nested function parameter stack.
 * @param _node - Function node being exited.
 */
function exitFunctionScope(
  parameterStack: Readonly<ParameterScopeStack>,
  _node: Readonly<FunctionNode>,
): void {
  Reflect.apply(Array.prototype.pop, parameterStack, []);
}

/**
 * Creates a set of parameter names for one function scope.
 *
 * @param node - Function node to inspect.
 * @returns Set of parameter identifiers in that function signature.
 */
function getFunctionParameterNames(node: Readonly<FunctionNode>): ReadonlySet<string> {
  return new Set(node.params.map(getNamedParameterName).filter(isParameterName));
}

/**
 * Returns true when a parameter name was resolved.
 *
 * @param name - Candidate parameter name.
 * @returns True when the name is non-null.
 */
function isParameterName(name: string | null): name is string {
  return name !== null;
}

/**
 * Reports parameter reassignment when identifier belongs to current scope.
 *
 * @param context - ESLint rule execution context.
 * @param parameterStack - Nested function parameter stack.
 * @param node - Identifier node assigned or updated.
 */
function reportIfParameterReassigned(
  context: Readonly<NoParameterReassignContext>,
  parameterStack: Readonly<ParameterScopeStack>,
  node: Readonly<TSESTree.Identifier>,
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
