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
import { createRule } from './support/rule-factory';

enum NoNonNullAssertionMessageId {
  NoNonNullAssertion = 'noNonNullAssertion',
  UseOptionalChaining = 'useOptionalChaining',
}
type NoNonNullAssertionContext = Readonly<TSESLint.RuleContext<NoNonNullAssertionMessageId, []>>;

/**
 * Creates listeners for TS non-null assertion nodes.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoNonNullAssertionListeners(
  context: Readonly<NoNonNullAssertionContext>,
): TSESLint.RuleListener {
  return {
    TSNonNullExpression: reportNonNullAssertion.bind(undefined, context),
  };
}

/**
 * Creates an optional-chaining suggestion when the non-null assertion is in a safe syntactic form.
 *
 * @param node - TS non-null expression node.
 * @returns Optional-chaining suggestion entries.
 */
function createOptionalChainingSuggestions(
  node: Readonly<TSESTree.TSNonNullExpression>,
): TSESLint.ReportSuggestionArray<NoNonNullAssertionMessageId> {
  if (!isSafeOptionalChainingTarget(node)) {
    return [];
  }
  return [
    {
      messageId: NoNonNullAssertionMessageId.UseOptionalChaining,
      fix: replaceNonNullAssertionWithOptionalChain.bind(undefined, node),
    },
  ];
}

/**
 * Returns the optional-chain replacement token for one member expression.
 *
 * @param node - Member expression using the non-null assertion as object.
 * @returns Optional-chain token text.
 */
function getMemberOptionalChainText(node: Readonly<TSESTree.MemberExpression>): string {
  return node.computed ? '?.' : '?';
}

/**
 * Returns true when optional chaining can replace the non-null assertion without rewriting structure.
 *
 * @param node - TS non-null expression node.
 * @returns True when the parent expression supports optional chaining.
 */
function isSafeOptionalChainingTarget(node: Readonly<TSESTree.TSNonNullExpression>): boolean {
  const parent = node.parent;
  if (parent.type === AST_NODE_TYPES.MemberExpression && parent.object === node) {
    return !isUnsafeMemberUsage(parent);
  }
  return parent.type === AST_NODE_TYPES.CallExpression && parent.callee === node;
}

/**
 * Returns true when optional member access would create an unsafe assignment/update target.
 *
 * @param node - Member expression using the non-null assertion as object.
 * @returns True when the member usage is unsafe to suggest.
 */
function isUnsafeMemberUsage(node: Readonly<TSESTree.MemberExpression>): boolean {
  const parent = node.parent;
  return (
    (parent.type === AST_NODE_TYPES.AssignmentExpression && parent.left === node) ||
    (parent.type === AST_NODE_TYPES.UpdateExpression && parent.argument === node)
  );
}

/**
 * Replaces the non-null assertion token with optional-chain syntax.
 *
 * @param node - TS non-null expression node.
 * @param fixer - ESLint fixer.
 * @returns Generated replacement fix.
 */
function replaceNonNullAssertionWithOptionalChain(
  node: Readonly<TSESTree.TSNonNullExpression>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const replacementText =
    node.parent.type === AST_NODE_TYPES.MemberExpression && node.parent.object === node
      ? getMemberOptionalChainText(node.parent)
      : '?.';
  return fixer.replaceTextRange([node.expression.range[1], node.range[1]], replacementText);
}

/**
 * Reports a TS non-null assertion expression.
 *
 * @param context - ESLint rule execution context.
 * @param node - TS non-null expression node.
 */
function reportNonNullAssertion(
  context: Readonly<NoNonNullAssertionContext>,
  node: Readonly<TSESTree.TSNonNullExpression>,
): void {
  const suggestions = createOptionalChainingSuggestions(node);
  context.report({
    node,
    messageId: NoNonNullAssertionMessageId.NoNonNullAssertion,
    ...(suggestions.length > 0 ? { suggest: suggestions } : {}),
  });
}

/**
 * ESLint rule that disallows non-null assertions using the "!" postfix operator.
 */
export const noNonNullAssertion = createRule({
  name: 'no-non-null-assertion',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description: 'Disallow non-null assertions using the "!" postfix operator',
    },
    messages: {
      noNonNullAssertion:
        'Non-null assertion "!" bypasses TypeScript\'s type safety; use optional chaining or a proper null check instead',
      useOptionalChaining: 'Use optional chaining instead of a non-null assertion.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoNonNullAssertionListeners,
});

export default noNonNullAssertion;
