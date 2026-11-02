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
import { getMappedMemberPropertyName, getMemberPropertyName } from '../helpers/ast-helpers';
import { createRule } from './support/rule-factory';
import { isModuleImport, isNamedImport } from './support/test-imports';

const BANNED_ASSERTIONS: Record<string, string> = {
  called: 'callCount',
  calledWith: 'getCall',
  calledWithExactly: 'getCall',
  calledWithMatch: 'getCall',
};
const ASSERT_NAME = 'assert';
const CALLED_NAME = 'called';
const GET_CALL_NAME = 'getCall';
const SINON_MODULE = 'sinon';

type SinonContext = Readonly<TSESLint.RuleContext<'impreciseSpyAssertion', []>>;

/**
 * Reports imprecise Sinon assert calls.
 *
 * @param context - Rule execution context.
 * @param node - Assertion call expression.
 */
function checkCallExpression(
  context: Readonly<SinonContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  const callee = node.callee;
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return;
  }
  const assertion = getMappedMemberPropertyName(callee, BANNED_ASSERTIONS);
  if (assertion === null || !shouldReportAssertion(context, node, callee, assertion.name)) {
    return;
  }
  context.report({
    node: callee.property,
    messageId: 'impreciseSpyAssertion',
    data: { assertion: assertion.name, replacement: assertion.replacement },
  });
}

/**
 * Creates the Sinon assertion listener.
 *
 * @param context - Rule execution context.
 * @returns Rule listeners.
 */
function createListeners(context: Readonly<SinonContext>): TSESLint.RuleListener {
  return { CallExpression: checkCallExpression.bind(undefined, context) };
}

/**
 * Checks whether a call selects an indexed Sinon spy invocation.
 *
 * @param node - First argument of a Sinon assertion.
 * @returns Whether the call is getCall with an index.
 */
function isIndexedGetCall(node: Readonly<TSESTree.CallExpression>): boolean {
  const callee = node.callee;
  return (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    getMemberPropertyName(callee) === GET_CALL_NAME &&
    node.arguments.length > 0
  );
}

/**
 * Checks whether a member invokes an imported Sinon assert API.
 *
 * @param context - Rule execution context.
 * @param node - Assertion method member.
 * @returns Whether the member belongs to Sinon assert.
 */
function isSinonAssertMember(
  context: Readonly<SinonContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  const receiver = node.object;
  if (receiver.type === AST_NODE_TYPES.Identifier) {
    return isNamedImport(context, receiver, SINON_MODULE, ASSERT_NAME);
  }
  return (
    receiver.type === AST_NODE_TYPES.MemberExpression && isSinonAssertObject(context, receiver)
  );
}

/**
 * Checks whether an assert object is imported through Sinon.
 *
 * @param context - Rule execution context.
 * @param node - Assertion object member.
 * @returns Whether the object is a Sinon assert namespace.
 */
function isSinonAssertObject(
  context: Readonly<SinonContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === ASSERT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isModuleImport(context, node.object, SINON_MODULE)
  );
}

/**
 * Checks whether a Sinon assertion inspects a numbered call.
 *
 * @param node - Sinon assertion call.
 * @returns Whether its first argument is a getCall invocation.
 */
function isSpecificCallAssertion(node: Readonly<TSESTree.CallExpression>): boolean {
  if (node.arguments.length === 0) {
    return false;
  }
  const firstArgument = node.arguments[0];
  return firstArgument.type === AST_NODE_TYPES.CallExpression && isIndexedGetCall(firstArgument);
}

/**
 * Determines whether a Sinon assertion call needs a diagnostic.
 *
 * @param context - Rule execution context.
 * @param node - Assertion call.
 * @param callee - Assertion method member.
 * @param assertionName - Sinon assertion name.
 * @returns Whether the assertion is imprecise.
 */
function shouldReportAssertion(
  context: Readonly<SinonContext>,
  node: Readonly<TSESTree.CallExpression>,
  callee: Readonly<TSESTree.MemberExpression>,
  assertionName: string,
): boolean {
  return (
    isSinonAssertMember(context, callee) &&
    (assertionName === CALLED_NAME || !isSpecificCallAssertion(node))
  );
}

/** Rule that requires explicit Sinon spy call counts and call indices. */
export const noSinonImpreciseSpyAssertions = createRule({
  name: 'no-sinon-imprecise-spy-assertions',
  meta: {
    type: 'suggestion',
    docs: { description: 'Require exact Sinon spy call counts and invocation arguments' },
    messages: {
      impreciseSpyAssertion:
        '"{{assertion}}" is imprecise; use "{{replacement}}" with an explicit count or call index',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createListeners,
});

export default noSinonImpreciseSpyAssertions;
