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
import { isNamedImport } from './support/test-imports';

const BANNED_MATCHERS: Record<string, string> = {
  toHaveBeenCalled: 'toHaveBeenCalledTimes',
  toHaveBeenCalledWith: 'toHaveBeenNthCalledWith',
  toHaveBeenLastCalledWith: 'toHaveBeenNthCalledWith',
};
const EXPECT_NAME = 'expect';
const NOT_NAME = 'not';
const SOFT_NAME = 'soft';
const VITEST_MODULE = 'vitest';
const ZERO_CALL_MATCHER = 'toHaveBeenCalled';
const ASSERTION_MODIFIERS = new Set(['not', 'resolves', 'rejects']);

type VitestContext = Readonly<TSESLint.RuleContext<'impreciseSpyAssertion', []>>;

/**
 * Reports imprecise Vitest spy assertions.
 *
 * @param context - Rule execution context.
 * @param node - Matcher member expression.
 */
function checkMemberExpression(
  context: Readonly<VitestContext>,
  node: Readonly<TSESTree.MemberExpression>,
): void {
  const matcher = getMappedMemberPropertyName(node, BANNED_MATCHERS);
  if (matcher === null || !shouldReportMatcher(context, node, matcher.name)) {
    return;
  }
  context.report({
    node: node.property,
    messageId: 'impreciseSpyAssertion',
    data: { matcher: matcher.name, replacement: matcher.replacement },
  });
}

/**
 * Creates the Vitest matcher listener.
 *
 * @param context - Rule execution context.
 * @returns Rule listeners.
 */
function createListeners(context: Readonly<VitestContext>): TSESLint.RuleListener {
  return { MemberExpression: checkMemberExpression.bind(undefined, context) };
}

/**
 * Checks whether a receiver begins with imported Vitest expect.
 *
 * @param context - Rule execution context.
 * @param receiver - Matcher receiver.
 * @returns Whether the receiver is a Vitest assertion chain.
 */
function isExpectReceiver(
  context: Readonly<VitestContext>,
  receiver: Readonly<TSESTree.Expression>,
): boolean {
  if (receiver.type === AST_NODE_TYPES.MemberExpression) {
    return isModifier(receiver) && isExpectReceiver(context, receiver.object);
  }
  return receiver.type === AST_NODE_TYPES.CallExpression && isVitestExpectCall(context, receiver);
}

/**
 * Checks whether a member is a Vitest assertion modifier.
 *
 * @param node - Member expression to inspect.
 * @returns Whether the member is a modifier.
 */
function isModifier(node: Readonly<TSESTree.MemberExpression>): boolean {
  return ASSERTION_MODIFIERS.has(getMemberPropertyName(node) ?? '');
}

/**
 * Checks whether a matcher chain contains not.
 *
 * @param receiver - Matcher receiver.
 * @returns Whether the assertion is negated.
 */
function isNegated(receiver: Readonly<TSESTree.Expression>): boolean {
  if (receiver.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return getMemberPropertyName(receiver) === NOT_NAME || isNegated(receiver.object);
}

/**
 * Checks whether a call invokes expect imported from Vitest.
 *
 * @param context - Rule execution context.
 * @param node - Call at the start of the assertion chain.
 * @returns Whether the call invokes Vitest expect.
 */
function isVitestExpectCall(
  context: Readonly<VitestContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return isNamedImport(context, callee, VITEST_MODULE, EXPECT_NAME);
  }
  return callee.type === AST_NODE_TYPES.MemberExpression && isVitestSoftExpect(context, callee);
}

/**
 * Checks whether a matcher is invoked on a Vitest expect result.
 *
 * @param context - Rule execution context.
 * @param node - Matcher member expression.
 * @returns Whether the matcher is a Vitest assertion call.
 */
function isVitestMatcherCall(
  context: Readonly<VitestContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  if (node.parent.type !== AST_NODE_TYPES.CallExpression || node.parent.callee !== node) {
    return false;
  }
  return isExpectReceiver(context, node.object);
}

/**
 * Checks whether a member calls soft on imported Vitest expect.
 *
 * @param context - Rule execution context.
 * @param node - Soft expect member expression.
 * @returns Whether the member belongs to Vitest expect.
 */
function isVitestSoftExpect(
  context: Readonly<VitestContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === SOFT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isNamedImport(context, node.object, VITEST_MODULE, EXPECT_NAME)
  );
}

/**
 * Determines whether a matcher call requires a diagnostic.
 *
 * @param context - Rule execution context.
 * @param node - Matcher member expression.
 * @param matcherName - Banned matcher name.
 * @returns Whether the call is imprecise.
 */
function shouldReportMatcher(
  context: Readonly<VitestContext>,
  node: Readonly<TSESTree.MemberExpression>,
  matcherName: string,
): boolean {
  return (
    isVitestMatcherCall(context, node) &&
    !(matcherName === ZERO_CALL_MATCHER && isNegated(node.object))
  );
}

/** Rule that requires explicit Vitest spy call counts and call indices. */
export const noVitestImpreciseSpyAssertions = createRule({
  name: 'no-vitest-imprecise-spy-assertions',
  meta: {
    type: 'suggestion',
    docs: { description: 'Require exact Vitest spy call counts and invocation indices' },
    messages: {
      impreciseSpyAssertion:
        '"{{matcher}}" is imprecise; use "{{replacement}}" with an explicit call count or invocation index',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createListeners,
});

export default noVitestImpreciseSpyAssertions;
