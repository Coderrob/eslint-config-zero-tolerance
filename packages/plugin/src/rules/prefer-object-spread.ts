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
import { createRule } from './support/rule-factory';

const OBJECT_GLOBAL = 'Object';
const ASSIGN_METHOD = 'assign';

type PreferObjectSpreadContext = Readonly<TSESLint.RuleContext<'preferObjectSpread', []>>;

/**
 * Creates listeners for the prefer-object-spread rule.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createPreferObjectSpreadListeners(
  context: Readonly<PreferObjectSpreadContext>,
): TSESLint.RuleListener {
  return {
    /** @param node - Call expression node to evaluate. */
    CallExpression(node: Readonly<TSESTree.CallExpression>): void {
      if (
        isObjectAssignCall(node) &&
        isEmptyObjectLiteral(node.arguments[0]) &&
        !hasSpreadArgument(node)
      ) {
        reportObjectAssign(context, node);
      }
    },
  };
}

/**
 * Returns true when any Object.assign argument uses spread syntax.
 *
 * @param node - Call expression to inspect.
 * @returns Whether the call has spread arguments.
 */
function hasSpreadArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  return node.arguments.some(
    /** @param arg - Argument node to inspect. */
    (arg) => arg.type === AST_NODE_TYPES.SpreadElement,
  );
}

/**
 * Returns true when the node is an identifier named `assign`.
 *
 * @param node - Property node to check.
 * @returns Whether the property is the assign identifier.
 */
function isAssignProperty(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === ASSIGN_METHOD;
}

/**
 * Returns true when the node is an empty object literal.
 *
 * @param node - AST node to inspect.
 * @returns Whether the node is an empty ObjectExpression.
 */
function isEmptyObjectLiteral(node: Readonly<TSESTree.Node>): boolean {
  return node.type === AST_NODE_TYPES.ObjectExpression && node.properties.length === 0;
}

/**
 * Returns true when the call expression is Object.assign with at least one argument.
 *
 * @param node - Call expression to inspect.
 * @returns Whether the callee is Object.assign with arguments.
 */
function isObjectAssignCall(node: Readonly<TSESTree.CallExpression>): boolean {
  return node.arguments.length >= 1 && isObjectAssignMember(node.callee);
}

/**
 * Returns true when the callee is Object.assign as a non-computed member.
 *
 * @param callee - The callee expression from the call.
 * @returns Whether the callee matches Object.assign.
 */
function isObjectAssignMember(callee: Readonly<TSESTree.Expression>): boolean {
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) {
    return false;
  }
  return isObjectIdentifier(callee.object) && isAssignProperty(callee.property);
}

/**
 * Returns true when the node is the global Object identifier.
 *
 * @param node - AST node to inspect.
 * @returns Whether the node is Object.
 */
function isObjectIdentifier(node: Readonly<TSESTree.Expression>): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === OBJECT_GLOBAL;
}

/**
 * Reports an Object.assign call that can be replaced with object spread.
 *
 * @param context - ESLint rule execution context.
 * @param node - The Object.assign call expression.
 */
function reportObjectAssign(
  context: Readonly<PreferObjectSpreadContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  context.report({
    node,
    messageId: 'preferObjectSpread',
  });
}

/**
 * ESLint rule that enforces object spread syntax over Object.assign.
 */
export const preferObjectSpread = createRule({
  name: 'prefer-object-spread',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Report empty-target Object.assign calls for manual review before using object spread',
    },
    messages: {
      preferObjectSpread:
        'Review this Object.assign call before using object spread; getter and prototype behavior can differ.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferObjectSpreadListeners,
});

export default preferObjectSpread;
