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
import { createRule } from '../rule-factory';

const DELETE_OPERATOR = 'delete';

type NoObjectMutationContext = Readonly<TSESLint.RuleContext<'noObjectMutation', []>>;

/**
 * Checks assignment expressions for object-property writes.
 *
 * @param context - ESLint rule execution context.
 * @param node - Assignment expression node.
 */
function checkAssignmentExpression(
  context: NoObjectMutationContext,
  node: TSESTree.AssignmentExpression,
): void {
  if (!isMemberExpressionNode(node.left)) {
    return;
  }
  reportObjectMutation(context, node, 'assignment');
}

/**
 * Checks unary expressions for delete mutations.
 *
 * @param context - ESLint rule execution context.
 * @param node - Unary expression node.
 */
function checkUnaryExpression(
  context: NoObjectMutationContext,
  node: TSESTree.UnaryExpression,
): void {
  if (node.operator !== DELETE_OPERATOR || !isMemberExpressionNode(node.argument)) {
    return;
  }
  reportObjectMutation(context, node, DELETE_OPERATOR);
}

/**
 * Checks update expressions for object-property updates.
 *
 * @param context - ESLint rule execution context.
 * @param node - Update expression node.
 */
function checkUpdateExpression(
  context: NoObjectMutationContext,
  node: TSESTree.UpdateExpression,
): void {
  if (!isMemberExpressionNode(node.argument)) {
    return;
  }
  reportObjectMutation(context, node, 'update');
}

/**
 * Creates listeners for no-object-mutation checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoObjectMutationListeners(context: NoObjectMutationContext): TSESLint.RuleListener {
  return {
    AssignmentExpression: checkAssignmentExpression.bind(undefined, context),
    UnaryExpression: checkUnaryExpression.bind(undefined, context),
    UpdateExpression: checkUpdateExpression.bind(undefined, context),
  };
}

/**
 * Returns true when node is a MemberExpression.
 *
 * @param node - AST node to inspect.
 * @returns True for member expressions.
 */
function isMemberExpressionNode(node: TSESTree.Node): node is TSESTree.MemberExpression {
  return node.type === AST_NODE_TYPES.MemberExpression;
}

/**
 * Reports object mutation violations.
 *
 * @param context - ESLint rule execution context.
 * @param node - Node to report.
 * @param kind - Mutation kind label.
 */
function reportObjectMutation(
  context: NoObjectMutationContext,
  node: TSESTree.Node,
  kind: string,
): void {
  context.report({
    node,
    messageId: 'noObjectMutation',
    data: { kind },
  });
}

/** Disallows direct object-property mutation. */
export const noObjectMutation = createRule({
  name: 'no-object-mutation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow direct object-property mutation; prefer creating new objects with immutable update patterns',
    },
    messages: {
      noObjectMutation:
        'Avoid object mutation ({{kind}}); return a new object instead of mutating existing state.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoObjectMutationListeners,
});

export default noObjectMutation;
