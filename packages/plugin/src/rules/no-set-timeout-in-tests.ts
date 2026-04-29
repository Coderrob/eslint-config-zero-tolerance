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
const SET_TIMEOUT_NAME = 'setTimeout';
const SINGLE_CALLEE_PATH_LENGTH = 1;

type NoSetTimeoutInTestsContext = Readonly<
  TSESLint.RuleContext<'noSetTimeoutInTests', []>
>;

/**
 * Checks call expressions for global setTimeout usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: Readonly<NoSetTimeoutInTestsContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!isRestrictedSetTimeoutCall(node)) {
    return;
  }

  context.report({
    node,
    messageId: 'noSetTimeoutInTests',
  });
}

/**
 * Creates listeners for test files only.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoSetTimeoutInTestsListeners(
  context: Readonly<NoSetTimeoutInTestsContext>,
): TSESLint.RuleListener {
  if (!isTestFile(context.filename)) {
    return {};
  }

  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/**
 * Returns true when a callee path targets direct setTimeout.
 *
 * @param calleePath - Static callee name path.
 * @returns True when the path is exactly setTimeout.
 */
function isDirectSetTimeoutCall(calleePath: ReadonlyArray<string>): boolean {
  return calleePath.length === SINGLE_CALLEE_PATH_LENGTH && calleePath[0] === SET_TIMEOUT_NAME;
}

/**
 * Returns true when a callee path targets a global setTimeout member.
 *
 * @param calleePath - Static callee name path.
 * @returns True when the path is a known global object followed by setTimeout.
 */
function isGlobalSetTimeoutCall(calleePath: ReadonlyArray<string>): boolean {
  return (
    calleePath.length === MEMBER_CALLEE_PATH_LENGTH &&
    GLOBAL_TIMER_OBJECTS.has(calleePath[0]) &&
    calleePath[1] === SET_TIMEOUT_NAME
  );
}

/**
 * Returns true when a call expression invokes a global setTimeout API.
 *
 * @param node - Call expression node.
 * @returns True when the callee resolves to setTimeout or a known global timer object.
 */
function isRestrictedSetTimeoutCall(node: Readonly<TSESTree.CallExpression>): boolean {
  const calleePath = getCalleeNamePath(node.callee);
  if (calleePath === null) {
    return false;
  }

  return isDirectSetTimeoutCall(calleePath) || isGlobalSetTimeoutCall(calleePath);
}

/** ESLint rule that disallows setTimeout in test files. */
export const noSetTimeoutInTests = createRule({
  name: 'no-set-timeout-in-tests',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow setTimeout usage in test files',
    },
    messages: {
      noSetTimeoutInTests:
        'Avoid setTimeout in tests; use fake timers, explicit async coordination, or framework polling helpers instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoSetTimeoutInTestsListeners,
});

export default noSetTimeoutInTests;
