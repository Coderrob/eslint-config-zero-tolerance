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
import { isNamedIdentifierNode } from '../helpers/ast-guards';
import { RETURN_TYPE_NAME } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type NoReturnTypeContext = Readonly<TSESLint.RuleContext<'noReturnType', []>>;

/**
 * Checks whether a type reference targets ReturnType and reports it.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type reference node to inspect.
 */
function checkTypeReference(context: NoReturnTypeContext, node: TSESTree.TSTypeReference): void {
  if (!isReturnTypeReference(node)) {
    return;
  }

  reportReturnType(context, node);
}

/**
 * Creates listeners that report TypeScript ReturnType utility usage.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoReturnTypeListeners(context: NoReturnTypeContext): TSESLint.RuleListener {
  return {
    TSTypeReference: checkTypeReference.bind(undefined, context),
  };
}

/**
 * Returns true when a type reference targets TypeScript's ReturnType utility.
 *
 * @param node - Type reference node to inspect.
 * @returns Whether the type reference is ReturnType.
 */
function isReturnTypeReference(node: TSESTree.TSTypeReference): boolean {
  return isNamedIdentifierNode(node.typeName, RETURN_TYPE_NAME);
}

/**
 * Reports TypeScript ReturnType utility usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type reference node to report.
 */
function reportReturnType(context: NoReturnTypeContext, node: TSESTree.TSTypeReference): void {
  context.report({
    node,
    messageId: 'noReturnType',
  });
}

/**
 * ESLint rule that disallows TypeScript ReturnType utility usage.
 */
export const noReturnType = createRule({
  name: 'no-return-type',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow TypeScript ReturnType utility usage',
    },
    messages: {
      noReturnType:
        'ReturnType is not allowed; declare and export an explicit named return contract instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoReturnTypeListeners,
});

export default noReturnType;
