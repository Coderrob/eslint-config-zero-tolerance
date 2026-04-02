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
import { createRule } from './support/rule-factory';

type NoWithContext = Readonly<TSESLint.RuleContext<'noWith', []>>;

/**
 * Creates listeners for no-with rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoWithListeners(context: NoWithContext): TSESLint.RuleListener {
  return {
    WithStatement: reportWithUsage.bind(undefined, context),
  };
}

/**
 * Reports usage of with statements.
 *
 * @param context - ESLint rule execution context.
 * @param node - With statement node.
 */
function reportWithUsage(context: NoWithContext, node: TSESTree.WithStatement): void {
  context.report({
    node,
    messageId: 'noWith',
  });
}

/**
 * ESLint rule that disallows with statements.
 */
export const noWith = createRule({
  name: 'no-with',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow with statements because they make scope resolution unpredictable',
    },
    messages: {
      noWith:
        '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoWithListeners,
});

export default noWith;
