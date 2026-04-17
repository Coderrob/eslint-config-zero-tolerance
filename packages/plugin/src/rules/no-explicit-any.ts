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

type NoExplicitAnyContext = Readonly<TSESLint.RuleContext<'noExplicitAny', []>>;

/**
 * Checks explicit `any` keywords and reports each occurrence.
 *
 * @param context - ESLint rule execution context.
 * @param node - `any` keyword node.
 */
function checkTsAnyKeyword(context: NoExplicitAnyContext, node: TSESTree.TSAnyKeyword): void {
  context.report({
    node,
    messageId: 'noExplicitAny',
  });
}

/**
 * Creates listeners for explicit `any` detection.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoExplicitAnyListeners(context: NoExplicitAnyContext): TSESLint.RuleListener {
  return {
    TSAnyKeyword: checkTsAnyKeyword.bind(undefined, context),
  };
}

/** ESLint rule that disallows explicit `any` usage. */
export const noExplicitAny = createRule({
  name: 'no-explicit-any',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow explicit any; model unknown values precisely and narrow them explicitly',
    },
    messages: {
      noExplicitAny:
        'Avoid explicit any; use unknown, a named type, or a constrained generic instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoExplicitAnyListeners,
});

export default noExplicitAny;
