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

type NoEmptyCatchContext = Readonly<TSESLint.RuleContext<'emptyCatch', []>>;

/**
 * Reports empty catch blocks.
 *
 * @param context - ESLint rule execution context.
 * @param node - Catch clause node to evaluate.
 */
function checkCatchClause(
  context: Readonly<NoEmptyCatchContext>,
  node: Readonly<TSESTree.CatchClause>,
): void {
  if (!hasEmptyCatchBody(node)) {
    return;
  }

  context.report({
    node,
    messageId: 'emptyCatch',
  });
}

/**
 * Creates listeners for empty catch detection.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoEmptyCatchListeners(
  context: Readonly<NoEmptyCatchContext>,
): TSESLint.RuleListener {
  return {
    CatchClause: checkCatchClause.bind(undefined, context),
  };
}

/**
 * Returns true when a catch clause body has no statements.
 *
 * @param node - Catch clause node to inspect.
 * @returns True when the catch body is empty.
 */
function hasEmptyCatchBody(node: Readonly<TSESTree.CatchClause>): boolean {
  return node.body.body.length === 0;
}

/**
 * ESLint rule that disallows empty catch blocks.
 */
export const noEmptyCatch = createRule({
  name: 'no-empty-catch',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow empty catch blocks that silently swallow errors',
    },
    messages: {
      emptyCatch: 'Empty catch block silently swallows errors; handle or re-throw the error',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoEmptyCatchListeners,
});

export default noEmptyCatch;
