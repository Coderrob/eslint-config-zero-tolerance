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
import { getMatchingCallMemberMethodName } from '../helpers/ast/calls';
import { createRule } from './support/rule-factory';

const MUTATING_ARRAY_METHODS = new Set([
  'copyWithin',
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
]);

type NoArrayMutationContext = Readonly<TSESLint.RuleContext<'noArrayMutation', []>>;

/**
 * Checks call expressions for mutating array-method usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: Readonly<NoArrayMutationContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  const methodName = getMatchingCallMemberMethodName(node, MUTATING_ARRAY_METHODS);
  if (methodName === null) {
    return;
  }
  context.report({
    node,
    messageId: 'noArrayMutation',
    data: { method: methodName },
  });
}

/**
 * Creates listeners for no-array-mutation checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoArrayMutationListeners(
  context: Readonly<NoArrayMutationContext>,
): TSESLint.RuleListener {
  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/** Disallows mutating array methods. */
export const noArrayMutation = createRule({
  name: 'no-array-mutation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow mutating array methods; prefer immutable alternatives such as spread, slice, and toSorted',
    },
    messages: {
      noArrayMutation:
        'Avoid array mutation via "{{method}}"; prefer immutable operations that return a new array.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoArrayMutationListeners,
});

export default noArrayMutation;
