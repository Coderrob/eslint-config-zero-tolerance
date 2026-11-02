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

const BANNED_MATCHERS: Record<string, string> = {
  toBeCalled: 'toHaveBeenCalledTimes',
  toBeCalledWith: 'toHaveBeenNthCalledWith',
  toHaveBeenCalled: 'toHaveBeenCalledTimes',
  toHaveBeenCalledWith: 'toHaveBeenNthCalledWith',
  toHaveBeenLastCalledWith: 'toHaveBeenNthCalledWith',
  toLastCalledWith: 'toHaveBeenNthCalledWith',
};

type NoJestHaveBeenCalledContext = Readonly<TSESLint.RuleContext<'noHaveBeenCalled', []>>;

const ASSERTION_MODIFIERS = new Set(['not', 'resolves', 'rejects']);
const EXPECT_NAME = 'expect';
const GLOBAL_EXPECT_OWNERS = new Set(['globalThis', 'global']);
const JEST_GLOBALS_MODULE = '@jest/globals';
const IMPORT_BINDING_TYPE = 'ImportBinding';
const NEGATION_NAME = 'not';
const ZERO_CALL_MATCHERS = new Set(['toBeCalled', 'toHaveBeenCalled']);

/**
 * Checks member expressions for banned Jest matchers.
 *
 * @param context - ESLint rule execution context.
 * @param node - Member expression node to inspect.
 */
function checkMemberExpression(
  context: Readonly<NoJestHaveBeenCalledContext>,
  node: Readonly<TSESTree.MemberExpression>,
): void {
  const bannedMatcher = getMappedMemberPropertyName(node, BANNED_MATCHERS);
  if (bannedMatcher === null || !shouldReportMatcher(context, node, bannedMatcher.name)) {
    return;
  }

  context.report({
    node: node.property,
    messageId: 'noHaveBeenCalled',
    data: {
      matcher: bannedMatcher.name,
      replacement: bannedMatcher.replacement,
    },
  });
}

/**
 * Creates listeners for banned Jest matcher usage.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoJestHaveBeenCalledListeners(
  context: Readonly<NoJestHaveBeenCalledContext>,
): TSESLint.RuleListener {
  return {
    MemberExpression: checkMemberExpression.bind(undefined, context),
  };
}

/**
 * Finds a lexical binding for an identifier.
 *
 * @param scope - Scope to search.
 * @param name - Identifier name.
 * @returns The nearest binding, or null when the identifier is unresolved.
 */
function findBinding(
  scope: TSESLint.Scope.Scope | null,
  name: string,
): TSESLint.Scope.Variable | null {
  if (scope === null) {
    return null;
  }
  return scope.set.get(name) ?? findBinding(scope.upper, name);
}

/**
 * Checks whether a member accesses a Jest assertion modifier.
 *
 * @param node - Receiver member expression.
 * @returns Whether the member is an assertion modifier.
 */
function isAssertionModifierMember(node: Readonly<TSESTree.MemberExpression>): boolean {
  return ASSERTION_MODIFIERS.has(getMemberPropertyName(node) ?? '');
}

/**
 * Checks a global expect member call.
 *
 * @param context - ESLint rule execution context.
 * @param node - Callee member expression.
 * @returns Whether the member is globalThis.expect or global.expect.
 */
function isGlobalExpectMember(
  context: Readonly<NoJestHaveBeenCalledContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  return (
    getMemberPropertyName(node) === EXPECT_NAME &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isUnshadowedGlobalIdentifier(context, node.object)
  );
}

/**
 * Checks whether a call invokes the Jest expect function.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression at the start of a matcher chain.
 * @returns Whether the call is a supported Jest expect form.
 */
function isJestExpectCall(
  context: Readonly<NoJestHaveBeenCalledContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return isJestExpectIdentifier(context, callee);
  }
  return callee.type === AST_NODE_TYPES.MemberExpression && isGlobalExpectMember(context, callee);
}

/**
 * Resolves the identifier to a Jest expect binding or an unshadowed global.
 *
 * @param context - ESLint rule execution context.
 * @param node - Identifier used as an expect call.
 * @returns Whether the identifier names Jest expect.
 */
function isJestExpectIdentifier(
  context: Readonly<NoJestHaveBeenCalledContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  const binding = findBinding(context.sourceCode.getScope(node), node.name);
  if (binding === null || binding.defs.length === 0) {
    return node.name === EXPECT_NAME;
  }
  return binding.defs.some(isJestImport);
}

/**
 * Checks whether a definition imports Jest's expect binding.
 *
 * @param definition - Lexical binding definition.
 * @returns Whether the definition imports expect from @jest/globals.
 */
function isJestImport(definition: Readonly<TSESLint.Scope.Definition>): boolean {
  if (definition.type !== IMPORT_BINDING_TYPE) {
    return false;
  }
  return isJestImportSource(definition.parent) && isJestImportSpecifier(definition.node);
}

/**
 * Checks the module source of an import.
 *
 * @param parent - Import declaration containing a binding.
 * @returns Whether the import comes from @jest/globals.
 */
function isJestImportSource(parent: Readonly<TSESTree.Node> | null): boolean {
  return (
    parent?.type === AST_NODE_TYPES.ImportDeclaration && parent.source.value === JEST_GLOBALS_MODULE
  );
}

/**
 * Checks whether an import specifier selects Jest's expect export.
 *
 * @param node - Import binding node.
 * @returns Whether the imported export is named expect.
 */
function isJestImportSpecifier(node: Readonly<TSESTree.Node>): boolean {
  return (
    node.type === AST_NODE_TYPES.ImportSpecifier &&
    node.imported.type === AST_NODE_TYPES.Identifier &&
    node.imported.name === EXPECT_NAME
  );
}

/**
 * Checks whether a matcher is called on a Jest expect chain.
 *
 * @param context - ESLint rule execution context.
 * @param node - Matcher member expression.
 * @returns Whether the matcher belongs to a Jest assertion.
 */
function isJestMatcherCall(
  context: Readonly<NoJestHaveBeenCalledContext>,
  node: Readonly<TSESTree.MemberExpression>,
): boolean {
  if (node.parent.type !== AST_NODE_TYPES.CallExpression || node.parent.callee !== node) {
    return false;
  }
  return isJestMatcherReceiver(context, node.object);
}

/**
 * Traces assertion modifiers back to a Jest expect call.
 *
 * @param context - ESLint rule execution context.
 * @param receiver - Matcher receiver expression.
 * @returns Whether the receiver begins with a Jest expect call.
 */
function isJestMatcherReceiver(
  context: Readonly<NoJestHaveBeenCalledContext>,
  receiver: Readonly<TSESTree.Expression>,
): boolean {
  if (receiver.type === AST_NODE_TYPES.MemberExpression) {
    return isAssertionModifierMember(receiver) && isJestMatcherReceiver(context, receiver.object);
  }
  return receiver.type === AST_NODE_TYPES.CallExpression && isJestExpectCall(context, receiver);
}

/**
 * Checks whether an assertion chain contains the Jest not modifier.
 *
 * @param receiver - Matcher receiver expression.
 * @returns Whether the assertion is negated.
 */
function isNegatedAssertion(receiver: Readonly<TSESTree.Expression>): boolean {
  if (receiver.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return getMemberPropertyName(receiver) === NEGATION_NAME || isNegatedAssertion(receiver.object);
}

/**
 * Checks whether a global object identifier has no local declaration.
 *
 * @param context - ESLint rule execution context.
 * @param node - Identifier used as the global object.
 * @returns Whether the identifier refers to an unshadowed global object.
 */
function isUnshadowedGlobalIdentifier(
  context: Readonly<NoJestHaveBeenCalledContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  const binding = findBinding(context.sourceCode.getScope(node), node.name);
  return GLOBAL_EXPECT_OWNERS.has(node.name) && (binding === null || binding.defs.length === 0);
}

/**
 * Determines whether a banned matcher call needs a diagnostic.
 *
 * @param context - ESLint rule execution context.
 * @param node - Matcher member expression.
 * @param matcherName - Banned matcher name.
 * @returns Whether the call is an imprecise Jest assertion.
 */
function shouldReportMatcher(
  context: Readonly<NoJestHaveBeenCalledContext>,
  node: Readonly<TSESTree.MemberExpression>,
  matcherName: string,
): boolean {
  return (
    isJestMatcherCall(context, node) &&
    !(ZERO_CALL_MATCHERS.has(matcherName) && isNegatedAssertion(node.object))
  );
}

/**
 * ESLint rule that prohibits deprecated Jest matchers in favor of explicit call count variants.
 */
export const noJestHaveBeenCalled = createRule({
  name: 'no-jest-have-been-called',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require exact call counts and invocation indices in Jest expect assertions, while allowing negated zero-call assertions',
    },
    messages: {
      noHaveBeenCalled:
        '"{{matcher}}" is not allowed; use "{{replacement}}" with an explicit call count (and nth-call index when applicable) instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoJestHaveBeenCalledListeners,
});

export default noJestHaveBeenCalled;
