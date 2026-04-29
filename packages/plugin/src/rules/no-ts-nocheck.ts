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
import { createRule } from './support/rule-factory';

const TS_NOCHECK_DIRECTIVE = '@ts-nocheck';

type NoTsNocheckContext = Readonly<TSESLint.RuleContext<'noTsNocheck', []>>;

/**
 * Reports all TypeScript nocheck comments found in the file.
 *
 * @param context - ESLint rule execution context.
 */
function checkProgram(context: Readonly<NoTsNocheckContext>): void {
  for (const comment of context.sourceCode.getAllComments()) {
    if (!isTsNocheckComment(comment.value)) {
      continue;
    }
    context.report({
      loc: comment.loc,
      messageId: 'noTsNocheck',
    });
  }
}

/**
 * Creates listeners that detect TypeScript nocheck comments.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoTsNocheckListeners(context: Readonly<NoTsNocheckContext>): TSESLint.RuleListener {
  return {
    Program: checkProgram.bind(undefined, context),
  };
}

/**
 * Returns true when a comment contains the TypeScript nocheck directive.
 *
 * @param value - Raw comment text.
 * @returns True when the comment disables TypeScript checking for the file.
 */
function isTsNocheckComment(value: string): boolean {
  return value.trim().startsWith(TS_NOCHECK_DIRECTIVE);
}

/**
 * ESLint rule that prevents use of TypeScript nocheck comments.
 */
export const noTsNocheck = createRule({
  name: 'no-ts-nocheck',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent use of @ts-nocheck comments',
    },
    messages: {
      noTsNocheck: 'TypeScript nocheck comments are not allowed; fix the type errors instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoTsNocheckListeners,
});

export default noTsNocheck;
