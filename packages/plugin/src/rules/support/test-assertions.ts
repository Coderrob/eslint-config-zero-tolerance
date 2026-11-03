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
import { getMemberPropertyName } from '../../helpers/ast-helpers';
import { getBinding, isModuleImport, isNamedImport } from './test-imports';
import { isVitestContextExpect } from './vitest-context-expect';

const ASSERT_NAME = 'assert';
const CHAI_MODULE = 'chai';
const EXPECT_NAME = 'expect';
const GLOBAL_OWNERS = new Set(['global', 'globalThis']);
const JEST_MODULE = '@jest/globals';
const NODE_ASSERT_MODULES = ['node:assert', 'node:assert/strict', 'assert', 'assert/strict'];
const SINON_MODULE = 'sinon';
const VITEST_MODULE = 'vitest';
const VITEST_EXPECT_METHODS = new Set(['soft', 'poll', 'element']);

type AssertionContext = Readonly<TSESLint.RuleContext<string, readonly unknown[]>>;

/**
 * Checks a Chai or Sinon assert receiver.
 *
 * @param context - Rule execution context.
 * @param receiver - Assert method receiver.
 * @returns Whether the receiver belongs to a supported assert API.
 */
function isAssertReceiver(
  context: Readonly<AssertionContext>,
  receiver: Readonly<TSESTree.Expression>,
): boolean {
  if (receiver.type === AST_NODE_TYPES.Identifier) {
    return isSupportedAssertIdentifier(context, receiver);
  }
  if (receiver.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return isModuleAssert(context, receiver) || isAssertReceiver(context, receiver.object);
}

/**
 * Checks a direct imported or unshadowed expect call.
 *
 * @param context - Rule execution context.
 * @param node - Expect callee identifier.
 * @returns Whether the identifier supplies a supported expect call.
 */
function isDirectExpect(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (
    isNamedExpectImport(context, node) ||
    isVitestContextExpect(context, node) ||
    (node.name === EXPECT_NAME && isUnbound(context, node))
  );
}

/**
 * Checks a global expect member call.
 *
 * @param context - Rule execution context.
 * @param node - Candidate expect member.
 * @returns Whether the member is on an unshadowed global object.
 */
function isGlobalExpect(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === EXPECT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isGlobalOwner(context, node.object)
  );
}

/**
 * Checks an unshadowed global expect owner.
 *
 * @param context - Rule execution context.
 * @param node - Candidate global identifier.
 * @returns Whether the identifier refers to a global object.
 */
function isGlobalOwner(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return GLOBAL_OWNERS.has(node.name) && isUnbound(context, node);
}

/**
 * Checks a member form of a supported expect call.
 *
 * @param context - Rule execution context.
 * @param node - Expect callee member.
 * @returns Whether the member is a supported expect entry point.
 */
function isMemberExpect(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    isModuleExpect(context, node) ||
    isGlobalExpect(context, node) ||
    isVitestExpectMethod(context, node)
  );
}

/**
 * Checks a Chai or Sinon module's assert property.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assert member.
 * @returns Whether a supported module owns assert.
 */
function isModuleAssert(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  if (
    getMemberPropertyName(node) !== ASSERT_NAME ||
    node.object.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }
  return (
    isModuleImport(context, node.object, CHAI_MODULE) ||
    isModuleImport(context, node.object, SINON_MODULE)
  );
}

/**
 * Checks a Chai module's expect property.
 *
 * @param context - Rule execution context.
 * @param node - Candidate expect member.
 * @returns Whether Chai owns the expect member.
 */
function isModuleExpect(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === EXPECT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isModuleImport(context, node.object, CHAI_MODULE)
  );
}

/**
 * Checks a named assert import from Chai, Sinon, or Vitest.
 *
 * @param context - Rule execution context.
 * @param node - Candidate import identifier.
 * @returns Whether the identifier is a supported assert binding.
 */
function isNamedAssertImport(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (
    isNamedImport(context, node, CHAI_MODULE, ASSERT_NAME) ||
    isNamedImport(context, node, SINON_MODULE, ASSERT_NAME) ||
    isNamedImport(context, node, VITEST_MODULE, ASSERT_NAME)
  );
}

/**
 * Checks a named expect import from a supported assertion package.
 *
 * @param context - Rule execution context.
 * @param node - Candidate import identifier.
 * @returns Whether the identifier is a supported expect binding.
 */
function isNamedExpectImport(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (
    isNamedImport(context, node, JEST_MODULE, EXPECT_NAME) ||
    isNamedImport(context, node, VITEST_MODULE, EXPECT_NAME) ||
    isNamedImport(context, node, CHAI_MODULE, EXPECT_NAME)
  );
}

/**
 * Checks a default, namespace, or strict Node assert import.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assert binding.
 * @returns Whether Node supplies the assert function.
 */
function isNodeAssertImport(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (
    NODE_ASSERT_MODULES.some((moduleName) => isModuleImport(context, node, moduleName)) ||
    isNamedImport(context, node, 'node:assert', 'strict') ||
    isNamedImport(context, node, 'assert', 'strict')
  );
}

/**
 * Checks an assertion called through Chai, Sinon, Vitest, or Node assert.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assertion call.
 * @returns Whether the call uses a supported assert binding.
 */
export function isSupportedAssertCall(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  return (
    (node.callee.type === AST_NODE_TYPES.Identifier && isNodeAssertImport(context, node.callee)) ||
    (node.callee.type === AST_NODE_TYPES.MemberExpression &&
      isAssertReceiver(context, node.callee.object))
  );
}

/**
 * Checks a supported assert identifier used as a method receiver.
 *
 * @param context - Rule execution context.
 * @param node - Candidate assert binding.
 * @returns Whether the binding supplies an assert API.
 */
function isSupportedAssertIdentifier(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return isNamedAssertImport(context, node) || isNodeAssertImport(context, node);
}

/**
 * Checks an expect call from Jest, Vitest, or Chai.
 *
 * @param context - Rule execution context.
 * @param node - Candidate expect call.
 * @returns Whether the call uses a supported expect binding.
 */
export function isSupportedExpectCall(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return isDirectExpect(context, callee);
  }
  return callee.type === AST_NODE_TYPES.MemberExpression && isMemberExpect(context, callee);
}

/**
 * Checks an unshadowed identifier.
 *
 * @param context - Rule execution context.
 * @param node - Identifier to inspect.
 * @returns Whether no local declaration defines the identifier.
 */
function isUnbound(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  const binding = getBinding(context, node);
  return binding === null || binding.defs.length === 0;
}

/**
 * Checks a Vitest expect import or unshadowed global.
 *
 * @param context - Rule execution context.
 * @param node - Candidate expect identifier.
 * @returns Whether the identifier can supply a Vitest expect method.
 */
function isVitestExpectIdentifier(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (
    isNamedImport(context, node, VITEST_MODULE, EXPECT_NAME) ||
    isVitestContextExpect(context, node) ||
    (node.name === EXPECT_NAME && isUnbound(context, node))
  );
}

/**
 * Checks a Vitest soft or poll expect member.
 *
 * @param context - Rule execution context.
 * @param node - Candidate expect member.
 * @returns Whether the member belongs to imported Vitest expect.
 */
function isVitestExpectMethod(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    VITEST_EXPECT_METHODS.has(getMemberPropertyName(node) ?? '') &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isVitestExpectIdentifier(context, node.object)
  );
}
