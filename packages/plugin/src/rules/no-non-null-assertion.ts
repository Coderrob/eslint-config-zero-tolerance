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
import { createRule } from '../rule-factory';

type NoNonNullAssertionContext = Readonly<TSESLint.RuleContext<'noNonNullAssertion', []>>;

/**
 * Creates listeners for TS non-null assertion nodes.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoNonNullAssertionListeners(
  context: NoNonNullAssertionContext,
): TSESLint.RuleListener {
  return {
    TSNonNullExpression: reportNonNullAssertion.bind(undefined, context),
  };
}

/**
 * Reports a TS non-null assertion expression.
 *
 * @param context - ESLint rule execution context.
 * @param node - TS non-null expression node.
 */
function reportNonNullAssertion(
  context: NoNonNullAssertionContext,
  node: TSESTree.TSNonNullExpression,
): void {
  context.report({ node, messageId: 'noNonNullAssertion' });
}

/**
 * ESLint rule that disallows non-null assertions using the "!" postfix operator.
 */
export const noNonNullAssertion = createRule({
  name: 'no-non-null-assertion',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow non-null assertions using the "!" postfix operator',
    },
    messages: {
      noNonNullAssertion:
        'Non-null assertion "!" bypasses TypeScript\'s type safety; use optional chaining or a proper null check instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoNonNullAssertionListeners,
});

export default noNonNullAssertion;
