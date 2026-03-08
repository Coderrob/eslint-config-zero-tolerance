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

import { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getMappedMemberPropertyName } from '../ast-helpers';
import { createRule } from '../rule-factory';

const BANNED_MATCHERS: Record<string, string> = {
  toBeCalled: 'toHaveBeenCalledTimes',
  toBeCalledWith: 'toHaveBeenNthCalledWith',
  toHaveBeenCalled: 'toHaveBeenCalledTimes',
  toHaveBeenCalledWith: 'toHaveBeenNthCalledWith',
  toHaveBeenLastCalledWith: 'toHaveBeenNthCalledWith',
  toLastCalledWith: 'toHaveBeenNthCalledWith',
};

type NoJestHaveBeenCalledContext = Readonly<TSESLint.RuleContext<'noHaveBeenCalled', []>>;

/**
 * Checks member expressions for banned Jest matchers.
 *
 * @param context - ESLint rule execution context.
 * @param node - Member expression node to inspect.
 */
function checkMemberExpression(
  context: NoJestHaveBeenCalledContext,
  node: TSESTree.MemberExpression,
): void {
  const bannedMatcher = getMappedMemberPropertyName(node, BANNED_MATCHERS);
  if (bannedMatcher === null) {
    return;
  }

  context.report({
    node: node.property,
    messageId: 'noHaveBeenCalled',
    data: {
      matcher: bannedMatcher.name,
      replacement: bannedMatcher.replacement,
    },
  });
}

/**
 * Creates listeners for banned Jest matcher usage.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoJestHaveBeenCalledListeners(
  context: NoJestHaveBeenCalledContext,
): TSESLint.RuleListener {
  return {
    MemberExpression: checkMemberExpression.bind(undefined, context),
  };
}

/**
 * ESLint rule that prohibits deprecated Jest matchers in favor of explicit call count variants.
 */
export const noJestHaveBeenCalled = createRule({
  name: 'no-jest-have-been-called',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prohibit toBeCalled, toHaveBeenCalled, toBeCalledWith, toHaveBeenCalledWith, toHaveBeenLastCalledWith, and toLastCalledWith; use toHaveBeenCalledTimes with an explicit call count and toHaveBeenNthCalledWith with an explicit nth-call index and arguments instead',
    },
    messages: {
      noHaveBeenCalled:
        '"{{matcher}}" is not allowed; use "{{replacement}}" with an explicit call count (and nth-call index when applicable) instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoJestHaveBeenCalledListeners,
});

export default noJestHaveBeenCalled;
