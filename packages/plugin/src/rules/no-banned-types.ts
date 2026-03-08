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
import { isIdentifierNode } from '../ast-guards';
import { RETURN_TYPE_NAME } from '../rule-constants';
import { createRule } from '../rule-factory';

type NoBannedTypesContext = Readonly<TSESLint.RuleContext<string, []>>;

/**
 * Checks indexed access types and reports every occurrence.
 *
 * @param context - ESLint rule execution context.
 * @param node - Indexed access type node to check.
 */
function checkIndexedAccessType(
  context: NoBannedTypesContext,
  node: TSESTree.TSIndexedAccessType,
): void {
  reportBannedIndexedAccess(context, node);
}

/**
 * Checks type references for banned `ReturnType` usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type reference node to check.
 */
function checkTypeReference(context: NoBannedTypesContext, node: TSESTree.TSTypeReference): void {
  if (!isReturnTypeReference(node)) {
    return;
  }

  reportBannedReturnType(context, node);
}

/**
 * Creates listeners for banned type constructs.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoBannedTypesListeners(context: NoBannedTypesContext): TSESLint.RuleListener {
  return {
    TSTypeReference: checkTypeReference.bind(undefined, context),
    TSIndexedAccessType: checkIndexedAccessType.bind(undefined, context),
  };
}

/**
 * Returns true when a type reference targets `ReturnType`.
 *
 * @param node - Type reference node to inspect.
 * @returns True when the type name matches `ReturnType`.
 */
function isReturnTypeReference(node: TSESTree.TSTypeReference): boolean {
  return isIdentifierNode(node.typeName) && node.typeName.name === RETURN_TYPE_NAME;
}

/**
 * Reports banned indexed access type usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Indexed access type node to report.
 */
function reportBannedIndexedAccess(
  context: NoBannedTypesContext,
  node: TSESTree.TSIndexedAccessType,
): void {
  context.report({
    node,
    messageId: 'bannedIndexedAccess',
  });
}

/**
 * Reports banned `ReturnType` usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type reference node to report.
 */
function reportBannedReturnType(
  context: NoBannedTypesContext,
  node: TSESTree.TSTypeReference,
): void {
  context.report({
    node,
    messageId: 'bannedReturnType',
  });
}

/**
 * ESLint rule that bans `ReturnType` and indexed access types.
 */
export const noBannedTypes = createRule({
  name: 'no-banned-types',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban ReturnType and indexed access types',
    },
    messages: {
      bannedReturnType: 'ReturnType is not allowed',
      bannedIndexedAccess: 'Indexed access types are not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoBannedTypesListeners,
});

export default noBannedTypes;
