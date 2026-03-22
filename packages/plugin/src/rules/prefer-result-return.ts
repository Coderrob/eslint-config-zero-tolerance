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
import { isTestFile } from '../ast-guards';
import { createRule } from '../rule-factory';

type PreferResultReturnContext = Readonly<TSESLint.RuleContext<'preferResultReturn', []>>;

/**
 * Creates listeners for non-test files.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createPreferResultReturnListeners(
  context: PreferResultReturnContext,
): TSESLint.RuleListener {
  if (isTestFile(context.filename)) {
    return {};
  }
  return {
    ThrowStatement: reportThrowStatement.bind(undefined, context),
  };
}

/**
 * Reports throw statements that should return Result values instead.
 *
 * @param context - ESLint rule execution context.
 * @param node - Throw statement node.
 */
function reportThrowStatement(
  context: PreferResultReturnContext,
  node: TSESTree.ThrowStatement,
): void {
  context.report({
    node,
    messageId: 'preferResultReturn',
  });
}

/** Prefers returning Result values over throwing in production code. */
export const preferResultReturn = createRule({
  name: 'prefer-result-return',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Result-style return values instead of throw statements to make error flows explicit and composable',
    },
    messages: {
      preferResultReturn:
        'Prefer returning a Result value instead of throwing; this keeps error handling explicit in function signatures.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferResultReturnListeners,
});

export default preferResultReturn;
