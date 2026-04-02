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
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { getMemberPropertyName } from '../helpers/ast-helpers';
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
function checkCallExpression(context: NoArrayMutationContext, node: TSESTree.CallExpression): void {
  const methodName = getMutatingMethodName(node);
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
function createNoArrayMutationListeners(context: NoArrayMutationContext): TSESLint.RuleListener {
  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/**
 * Returns mutating method name for array-like member call expressions.
 *
 * @param node - Call expression node.
 * @returns Method name when mutating, otherwise null.
 */
function getMutatingMethodName(node: TSESTree.CallExpression): string | null {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }
  const methodName = getMemberPropertyName(node.callee);
  if (methodName === null || !MUTATING_ARRAY_METHODS.has(methodName)) {
    return null;
  }
  return methodName;
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
