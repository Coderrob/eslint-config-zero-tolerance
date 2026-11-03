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
import { getMemberPropertyName } from '../helpers/ast-helpers';
import { createRule } from './support/rule-factory';
import { isModuleImport, isNamedImport } from './support/test-imports';

const ASSERTION_PARTS = new Set([
  'to',
  'be',
  'been',
  'is',
  'that',
  'which',
  'and',
  'has',
  'have',
  'with',
  'at',
  'of',
  'same',
  'but',
  'does',
  'still',
  'also',
  'not',
  'always',
  'deep',
]);
const ARGUMENT_MATCHERS = new Set([
  'calledWith',
  'calledWithExactly',
  'calledWithMatch',
  'lastCalledWith',
]);
const CHAI_MODULE = 'chai';
const CALLED_NAME = 'called';
const EXPECT_NAME = 'expect';
const GET_CALL_NAME = 'getCall';
const NOT_NAME = 'not';
const SOFT_NAME = 'soft';
const VITEST_MODULE = 'vitest';

type ChaiContext = Readonly<TSESLint.RuleContext<'impreciseSpyAssertion', []>>;

/**
 * Reports imprecise Chai-style spy assertions.
 *
 * @param context - Rule execution context.
 * @param node - Assertion member expression.
 */
function checkMemberExpression(
  context: Readonly<ChaiContext>,
  node: Readonly<TSESTree.MemberExpression>,
): void {
  const matcherName = getMemberPropertyName(node);
  if (matcherName === null || !shouldReportMatcher(context, node, matcherName)) {
    return;
  }
  context.report({
    node: node.property,
    messageId: 'impreciseSpyAssertion',
    data: { matcher: matcherName },
  });
}

/**
 * Creates listeners for Chai-style assertions.
 *
 * @param context - Rule execution context.
 * @returns Rule listeners.
 */
function createListeners(context: Readonly<ChaiContext>): TSESLint.RuleListener {
  return { MemberExpression: checkMemberExpression.bind(undefined, context) };
}

/**
 * Checks whether a call invokes Chai or Vitest expect.
 *
 * @param context - Rule execution context.
 * @param node - Call expression at the chain root.
 * @returns Whether the call is from a supported assertion package.
 */
function isChaiExpectCall(
  context: Readonly<ChaiContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return (
      isNamedImport(context, callee, CHAI_MODULE, EXPECT_NAME) ||
      isNamedImport(context, callee, VITEST_MODULE, EXPECT_NAME)
    );
  }
  return (
    callee.type === AST_NODE_TYPES.MemberExpression && isSupportedExpectMember(context, callee)
  );
}

/**
 * Checks whether a member is a Chai chain word.
 *
 * @param node - Assertion member.
 * @returns Whether the member is a supported chain word.
 */
function isChaiModifier(node: Readonly<TSESTree.MemberExpression>): boolean {
  return ASSERTION_PARTS.has(getMemberPropertyName(node) ?? '');
}

/**
 * Checks whether a module import exposes Chai expect.
 *
 * @param context - Rule execution context.
 * @param node - Expect callee member.
 * @returns Whether the member is a Chai expect import.
 */
function isChaiModuleExpect(
  context: Readonly<ChaiContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === EXPECT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isModuleImport(context, node.object, CHAI_MODULE)
  );
}

/**
 * Traces a Chai assertion chain to its expect call.
 *
 * @param context - Rule execution context.
 * @param receiver - Assertion receiver.
 * @returns Whether the receiver starts with Chai expect.
 */
function isChaiReceiver(
  context: Readonly<ChaiContext>,
  receiver: Readonly<TSESTree.Expression>,
): boolean {
  if (receiver.type === AST_NODE_TYPES.MemberExpression) {
    return isChaiModifier(receiver) && isChaiReceiver(context, receiver.object);
  }
  return receiver.type === AST_NODE_TYPES.CallExpression && isChaiExpectCall(context, receiver);
}

/**
 * Checks whether an argument matcher inspects an unspecified invocation.
 *
 * @param node - Matcher member expression.
 * @param matcherName - Matcher method name.
 * @returns Whether the matcher should be reported.
 */
function isImpreciseArgumentMatcher(
  node: Readonly<TSESTree.MemberExpression>,
  matcherName: string,
): boolean {
  return (
    ARGUMENT_MATCHERS.has(matcherName) &&
    isMatcherCall(node) &&
    !isNumberedCallReceiver(node.object)
  );
}

/**
 * Checks whether a called property asserts an unspecified positive count.
 *
 * @param node - Called assertion member.
 * @returns Whether the assertion is imprecise.
 */
function isImpreciseCalledProperty(node: Readonly<TSESTree.MemberExpression>): boolean {
  return !isMatcherCall(node) && !isNegated(node.object);
}

/**
 * Checks whether a call invokes getCall with an index.
 *
 * @param node - Candidate getCall expression.
 * @returns Whether the call selects an indexed invocation.
 */
function isIndexedSpyCall(node: Readonly<TSESTree.CallExpression>): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    getMemberPropertyName(node.callee) === GET_CALL_NAME &&
    node.arguments.length > 0
  );
}

/**
 * Checks whether an expect call receives an indexed Sinon spy call.
 *
 * @param node - Expect call expression.
 * @returns Whether its first argument is an indexed spy call.
 */
function isIndexedSpyCallArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  if (node.arguments.length === 0) {
    return false;
  }
  const argument = node.arguments[0];
  return argument.type === AST_NODE_TYPES.CallExpression && isIndexedSpyCall(argument);
}

/**
 * Checks whether an assertion matcher is invoked.
 *
 * @param node - Matcher member expression.
 * @returns Whether the matcher is called.
 */
function isMatcherCall(node: Readonly<TSESTree.MemberExpression>): boolean {
  return node.parent.type === AST_NODE_TYPES.CallExpression && node.parent.callee === node;
}

/**
 * Checks whether a Chai assertion chain contains not.
 *
 * @param receiver - Assertion receiver.
 * @returns Whether the assertion is negated.
 */
function isNegated(receiver: Readonly<TSESTree.Expression>): boolean {
  if (receiver.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return getMemberPropertyName(receiver) === NOT_NAME || isNegated(receiver.object);
}

/**
 * Traces assertion chain words to an expect call with an indexed spy call.
 *
 * @param receiver - Matcher receiver expression.
 * @returns Whether the assertion targets a numbered invocation.
 */
function isNumberedCallReceiver(receiver: Readonly<TSESTree.Expression>): boolean {
  if (receiver.type === AST_NODE_TYPES.MemberExpression) {
    return isNumberedCallReceiver(receiver.object);
  }
  return receiver.type === AST_NODE_TYPES.CallExpression && isIndexedSpyCallArgument(receiver);
}

/**
 * Checks whether a member invokes a supported assertion entry point.
 *
 * @param context - Rule execution context.
 * @param node - Expect callee member.
 * @returns Whether Chai or Vitest supplies the member.
 */
function isSupportedExpectMember(
  context: Readonly<ChaiContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return isChaiModuleExpect(context, node) || isVitestSoftExpect(context, node);
}

/**
 * Checks whether soft is called on imported Vitest expect.
 *
 * @param context - Rule execution context.
 * @param node - Soft expect member expression.
 * @returns Whether the member belongs to Vitest expect.
 */
function isVitestSoftExpect(
  context: Readonly<ChaiContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === SOFT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isNamedImport(context, node.object, VITEST_MODULE, EXPECT_NAME)
  );
}

/**
 * Decides whether a Chai spy assertion needs a diagnostic.
 *
 * @param context - Rule execution context.
 * @param node - Assertion member expression.
 * @param matcherName - Member property name.
 * @returns Whether the assertion is imprecise.
 */
function shouldReportMatcher(
  context: Readonly<ChaiContext>,
  node: Readonly<TSESTree.MemberExpression>,
  matcherName: string,
): boolean {
  if (!isChaiReceiver(context, node.object)) {
    return false;
  }
  if (matcherName === CALLED_NAME) {
    return isImpreciseCalledProperty(node);
  }
  return isImpreciseArgumentMatcher(node, matcherName);
}

/** Rule that requires precise Chai-style spy call assertions. */
export const noChaiImpreciseSpyAssertions = createRule({
  name: 'no-chai-imprecise-spy-assertions',
  meta: {
    type: 'suggestion',
    docs: { description: 'Require exact Chai-style spy call counts and invocation arguments' },
    messages: {
      impreciseSpyAssertion:
        '"{{matcher}}" is imprecise; assert an exact call count and inspect the intended invocation arguments',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createListeners,
});

export default noChaiImpreciseSpyAssertions;
