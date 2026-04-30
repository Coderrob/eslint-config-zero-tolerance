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

const FETCH_NAME = 'fetch';
const GLOBAL_FETCH_OBJECTS = new Set(['global', 'globalThis', 'self', 'window']);
const MEMBER_CALLEE_PATH_LENGTH = 2;
const SINGLE_CALLEE_PATH_LENGTH = 1;

type NoFetchInTestsContext = Readonly<TSESLint.RuleContext<'noFetchInTests', []>>;

/**
 * Checks call expressions for global fetch usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: Readonly<NoFetchInTestsContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!isRestrictedFetchCall(node)) {
    return;
  }

  context.report({
    node,
    messageId: 'noFetchInTests',
  });
}

/**
 * Creates listeners for test files only.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoFetchInTestsListeners(
  context: Readonly<NoFetchInTestsContext>,
): TSESLint.RuleListener {
  if (!isTestFile(context.filename)) {
    return {};
  }

  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/**
 * Returns true when a callee path targets direct fetch.
 *
 * @param calleePath - Static callee name path.
 * @returns True when the path is exactly fetch.
 */
function isDirectFetchCall(calleePath: ReadonlyArray<string>): boolean {
  return calleePath.length === SINGLE_CALLEE_PATH_LENGTH && calleePath[0] === FETCH_NAME;
}

/**
 * Returns true when a callee path targets a global fetch member.
 *
 * @param calleePath - Static callee name path.
 * @returns True when the path is a known global object followed by fetch.
 */
function isGlobalFetchCall(calleePath: ReadonlyArray<string>): boolean {
  return (
    calleePath.length === MEMBER_CALLEE_PATH_LENGTH &&
    GLOBAL_FETCH_OBJECTS.has(calleePath[0]) &&
    calleePath[1] === FETCH_NAME
  );
}

/**
 * Returns true when a call expression invokes a global fetch API.
 *
 * @param node - Call expression node.
 * @returns True when the callee resolves to fetch or a known global fetch object.
 */
function isRestrictedFetchCall(node: Readonly<TSESTree.CallExpression>): boolean {
  const calleePath = getCalleeNamePath(node.callee);
  if (calleePath === null) {
    return false;
  }

  return isDirectFetchCall(calleePath) || isGlobalFetchCall(calleePath);
}

/** ESLint rule that disallows fetch in test files. */
export const noFetchInTests = createRule({
  name: 'no-fetch-in-tests',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow fetch usage in test files',
    },
    messages: {
      noFetchInTests:
        'Avoid fetch in tests; inject a client, use a mock transport, or exercise HTTP through an explicit test boundary.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoFetchInTestsListeners,
});

export default noFetchInTests;
