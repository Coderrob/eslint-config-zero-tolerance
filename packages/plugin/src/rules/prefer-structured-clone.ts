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
import {
  isCallExpressionNode,
  isNamedIdentifierNode,
  isUncomputedMemberExpressionNode,
} from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

type PreferStructuredCloneContext = Readonly<TSESLint.RuleContext<'preferStructuredClone', []>>;

/**
 * Creates listeners for JSON cloning patterns.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createPreferStructuredCloneListeners(
  context: Readonly<PreferStructuredCloneContext>,
): TSESLint.RuleListener {
  return { CallExpression: reportJsonClone.bind(undefined, context) };
}

/**
 * Returns the sole non-spread argument of a call when present.
 *
 * @param node - Call expression to inspect.
 * @returns The sole expression argument or null.
 */
function getOnlyExpressionArgument(
  node: Readonly<TSESTree.CallExpression>,
): TSESTree.Expression | null {
  if (node.arguments.length !== 1) {
    return null;
  }
  const [argument] = node.arguments;
  return argument.type === AST_NODE_TYPES.SpreadElement ? null : argument;
}

/**
 * Checks whether a call targets a named JSON method.
 *
 * @param node - Call expression to inspect.
 * @param methodName - Expected JSON method name.
 * @returns Whether the callee matches the method.
 */
function isJsonMethodCall(node: Readonly<TSESTree.CallExpression>, methodName: string): boolean {
  if (!isUncomputedMemberExpressionNode(node.callee)) {
    return false;
  }
  return (
    isNamedIdentifierNode(node.callee.object, 'JSON') &&
    isNamedIdentifierNode(node.callee.property, methodName)
  );
}

/**
 * Checks whether a call exactly matches the JSON cloning pattern.
 *
 * @param node - Candidate parse call.
 * @returns Whether it wraps a single-argument stringify call.
 */
function isJsonParseOfJsonStringify(node: Readonly<TSESTree.CallExpression>): boolean {
  if (!isJsonMethodCall(node, 'parse')) {
    return false;
  }
  const argument = getOnlyExpressionArgument(node);
  return isSingleArgumentJsonStringify(argument);
}

/**
 * Checks whether an expression is a direct single-argument JSON stringify call.
 *
 * @param argument - Expression to inspect.
 * @returns Whether it is the expected stringify call.
 */
function isSingleArgumentJsonStringify(argument: TSESTree.Expression | null): boolean {
  return (
    argument !== null &&
    isCallExpressionNode(argument) &&
    isJsonMethodCall(argument, 'stringify') &&
    getOnlyExpressionArgument(argument) !== null
  );
}

/**
 * Reports JSON cloning patterns for manual review of value semantics.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression to inspect.
 */
function reportJsonClone(
  context: Readonly<PreferStructuredCloneContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!isJsonParseOfJsonStringify(node)) {
    return;
  }
  context.report({ node, messageId: 'preferStructuredClone' });
}

/** Reports JSON cloning patterns that require a semantic review before replacement. */
export const preferStructuredClone = createRule({
  name: 'prefer-structured-clone',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Review JSON.parse(JSON.stringify(...)) before considering structuredClone(...)',
    },
    messages: {
      preferStructuredClone:
        'Review value semantics before replacing JSON cloning with structuredClone; the operations can differ.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferStructuredCloneListeners,
});

export default preferStructuredClone;
