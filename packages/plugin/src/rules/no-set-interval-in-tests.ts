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
import { isTestFile } from '../helpers/ast-guards';
import { getCalleeNamePath } from '../helpers/ast/calls';
import { createRule } from './support/rule-factory';

const GLOBAL_TIMER_OBJECTS = new Set(['global', 'globalThis', 'self', 'window']);
const MEMBER_CALLEE_PATH_LENGTH = 2;
const SET_INTERVAL_NAME = 'setInterval';
const SINGLE_CALLEE_PATH_LENGTH = 1;

type NoSetIntervalInTestsContext = Readonly<
  TSESLint.RuleContext<'noSetIntervalInTests', []>
>;

/**
 * Checks call expressions for global setInterval usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: NoSetIntervalInTestsContext,
  node: TSESTree.CallExpression,
): void {
  if (!isRestrictedSetIntervalCall(node)) {
    return;
  }

  context.report({
    node,
    messageId: 'noSetIntervalInTests',
  });
}

/**
 * Creates listeners for test files only.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoSetIntervalInTestsListeners(
  context: NoSetIntervalInTestsContext,
): TSESLint.RuleListener {
  if (!isTestFile(context.filename)) {
    return {};
  }

  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/**
 * Returns true when a callee path targets direct setInterval.
 *
 * @param calleePath - Static callee name path.
 * @returns True when the path is exactly setInterval.
 */
function isDirectSetIntervalCall(calleePath: ReadonlyArray<string>): boolean {
  return calleePath.length === SINGLE_CALLEE_PATH_LENGTH && calleePath[0] === SET_INTERVAL_NAME;
}

/**
 * Returns true when a callee path targets a global setInterval member.
 *
 * @param calleePath - Static callee name path.
 * @returns True when the path is a known global object followed by setInterval.
 */
function isGlobalSetIntervalCall(calleePath: ReadonlyArray<string>): boolean {
  return (
    calleePath.length === MEMBER_CALLEE_PATH_LENGTH &&
    GLOBAL_TIMER_OBJECTS.has(calleePath[0]) &&
    calleePath[1] === SET_INTERVAL_NAME
  );
}

/**
 * Returns true when a call expression invokes a global setInterval API.
 *
 * @param node - Call expression node.
 * @returns True when the callee resolves to setInterval or a known global timer object.
 */
function isRestrictedSetIntervalCall(node: TSESTree.CallExpression): boolean {
  const calleePath = getCalleeNamePath(node.callee);
  if (calleePath === null) {
    return false;
  }

  return isDirectSetIntervalCall(calleePath) || isGlobalSetIntervalCall(calleePath);
}

/** ESLint rule that disallows setInterval in test files. */
export const noSetIntervalInTests = createRule({
  name: 'no-set-interval-in-tests',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow setInterval usage in test files',
    },
    messages: {
      noSetIntervalInTests:
        'Avoid setInterval in tests; use fake timers, explicit async coordination, or framework polling helpers instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoSetIntervalInTestsListeners,
});

export default noSetIntervalInTests;
