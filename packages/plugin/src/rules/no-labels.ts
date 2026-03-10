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

type NoLabelsContext = Readonly<TSESLint.RuleContext<'noLabels', []>>;

/**
 * Creates listeners for no-labels rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoLabelsListeners(context: NoLabelsContext): TSESLint.RuleListener {
  return {
    LabeledStatement: reportLabelsUsage.bind(undefined, context),
  };
}

/**
 * Reports usage of labeled statements.
 *
 * @param context - ESLint rule execution context.
 * @param node - Labeled statement node.
 */
function reportLabelsUsage(context: NoLabelsContext, node: TSESTree.LabeledStatement): void {
  context.report({
    node,
    messageId: 'noLabels',
  });
}

/**
 * ESLint rule that disallows labeled statements.
 */
export const noLabels = createRule({
  name: 'no-labels',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow labels because they make control flow harder to reason about',
    },
    messages: {
      noLabels:
        'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoLabelsListeners,
});

export default noLabels;
