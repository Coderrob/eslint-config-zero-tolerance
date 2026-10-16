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

import type { TSESLint } from '@typescript-eslint/utils';
import { createRule } from './support/rule-factory';

type NoParameterReassignContext = Readonly<TSESLint.RuleContext<'noParameterReassign', []>>;
const PARAMETER_DEFINITION_TYPE = 'Parameter';

/**
 * Inspects every resolved binding after scope analysis completes.
 *
 * @param context - ESLint execution context.
 */
function checkParameterBindings(context: Readonly<NoParameterReassignContext>): void {
  checkScopeBindings(context, context.sourceCode.getScope(context.sourceCode.ast));
}

/**
 * Inspects bindings in a lexical scope and its children.
 *
 * @param context - ESLint execution context.
 * @param scope - Lexical scope to inspect.
 */
function checkScopeBindings(
  context: Readonly<NoParameterReassignContext>,
  scope: Readonly<TSESLint.Scope.Scope>,
): void {
  for (const variable of scope.variables) reportParameterWrites(context, variable);
  for (const child of scope.childScopes) checkScopeBindings(context, child);
}

/**
 * Creates listeners for parameter reassignment checks.
 *
 * @param context - ESLint execution context.
 * @returns Completed-program scope listener.
 */
function createNoParameterReassignListeners(
  context: Readonly<NoParameterReassignContext>,
): TSESLint.RuleListener {
  return { 'Program:exit': checkParameterBindings.bind(undefined, context) };
}

/**
 * Checks whether a reference writes after parameter initialization.
 *
 * @param reference - Resolved reference to inspect.
 * @returns Whether the reference reassigns the parameter.
 */
function isParameterWrite(reference: Readonly<TSESLint.Scope.Reference>): boolean {
  return reference.isWrite() && !Object.is(reference.init, true);
}

/**
 * Reports write references to parameter bindings across nested lexical scopes.
 *
 * @param context - ESLint execution context.
 * @param variable - Resolved binding to inspect.
 */
function reportParameterWrites(
  context: Readonly<NoParameterReassignContext>,
  variable: Readonly<TSESLint.Scope.Variable>,
): void {
  if (!variable.defs.some((definition) => definition.type === PARAMETER_DEFINITION_TYPE)) return;
  for (const reference of variable.references) {
    if (isParameterWrite(reference)) {
      context.report({
        node: reference.identifier,
        messageId: 'noParameterReassign',
        data: { name: variable.name },
      });
    }
  }
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
