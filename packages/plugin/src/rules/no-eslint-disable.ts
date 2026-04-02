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

import type { TSESLint } from '@typescript-eslint/utils';
import { ESLINT_DISABLE_PREFIX } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type NoEslintDisableContext = Readonly<TSESLint.RuleContext<'noEslintDisable', []>>;

/**
 * Reports all eslint-disable comments found in the file.
 *
 * @param context - ESLint rule execution context.
 */
function checkProgram(context: NoEslintDisableContext): void {
  const comments = context.sourceCode.getAllComments();

  for (const comment of comments) {
    if (!isEslintDisableComment(comment.value)) {
      continue;
    }

    context.report({
      loc: comment.loc,
      messageId: 'noEslintDisable',
    });
  }
}

/**
 * Creates listeners that detect eslint-disable comments.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoEslintDisableListeners(context: NoEslintDisableContext): TSESLint.RuleListener {
  return {
    Program: checkProgram.bind(undefined, context),
  };
}

/**
 * Returns true when a comment value starts with an eslint-disable directive.
 *
 * @param value - Raw comment text.
 * @returns True when the comment is an eslint-disable directive.
 */
function isEslintDisableComment(value: string): boolean {
  return value.trim().startsWith(ESLINT_DISABLE_PREFIX);
}

/**
 * ESLint rule that prevents use of eslint-disable comments.
 */
export const noEslintDisable = createRule({
  name: 'no-eslint-disable',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent use of eslint-disable comments',
    },
    messages: {
      noEslintDisable: 'ESLint disable comments are not allowed; fix the underlying issue instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoEslintDisableListeners,
});

export default noEslintDisable;
