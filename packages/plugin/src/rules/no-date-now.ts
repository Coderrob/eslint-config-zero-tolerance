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
import {
  isNamedIdentifierNode,
  isUncomputedMemberExpressionNode,
} from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

const DATE_IDENTIFIER = 'Date';
const NOW_IDENTIFIER = 'now';

enum NoDateNowMessageId {
  NoDateNow = 'noDateNow',
  NoNewDateNow = 'noNewDateNow',
}

type NoDateNowContext = Readonly<TSESLint.RuleContext<NoDateNowMessageId, []>>;

/**
 * Checks call expressions for Date.now usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(context: NoDateNowContext, node: TSESTree.CallExpression): void {
  if (!isDateNowCall(node)) {
    return;
  }
  context.report({
    node,
    messageId: NoDateNowMessageId.NoDateNow,
  });
}

/**
 * Checks new expressions for no-arg new Date() usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - New expression node.
 */
function checkNewExpression(context: NoDateNowContext, node: TSESTree.NewExpression): void {
  if (!isNoArgDateConstructor(node)) {
    return;
  }
  context.report({
    node,
    messageId: NoDateNowMessageId.NoNewDateNow,
  });
}

/**
 * Creates listeners for no-date-now checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoDateNowListeners(context: NoDateNowContext): TSESLint.RuleListener {
  return {
    CallExpression: checkCallExpression.bind(undefined, context),
    NewExpression: checkNewExpression.bind(undefined, context),
  };
}

/**
 * Returns true when node is Date.now().
 *
 * @param node - Call expression node.
 * @returns True for Date.now call.
 */
function isDateNowCall(node: TSESTree.CallExpression): boolean {
  if (!isDateNowMember(node.callee)) {
    return false;
  }
  return true;
}

/**
 * Returns true when expression is a non-computed Date.now member access.
 *
 * @param node - Call-expression callee.
 * @returns True when member is Date.now.
 */
function isDateNowMember(node: TSESTree.Expression): boolean {
  if (!isUncomputedMemberExpressionNode(node)) {
    return false;
  }
  return isDateNowObject(node.object) && isNowProperty(node.property);
}

/**
 * Returns true when member object is Date identifier.
 *
 * @param node - Member object node.
 * @returns True when object is Date.
 */
function isDateNowObject(node: TSESTree.Expression): boolean {
  return isNamedIdentifierNode(node, DATE_IDENTIFIER);
}

/**
 * Returns true when node is new Date() with no arguments.
 *
 * @param node - New expression node.
 * @returns True for no-arg Date constructor.
 */
function isNoArgDateConstructor(node: TSESTree.NewExpression): boolean {
  if (!isNamedIdentifierNode(node.callee, DATE_IDENTIFIER)) {
    return false;
  }
  return node.arguments.length === 0;
}

/**
 * Returns true when member property is now identifier.
 *
 * @param node - Member property node.
 * @returns True when property is now.
 */
function isNowProperty(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  return isNamedIdentifierNode(node, NOW_IDENTIFIER);
}

/** Disallows Date.now() and no-arg new Date(). */
export const noDateNow = createRule({
  name: 'no-date-now',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow Date.now() and new Date(); prefer injected clocks for deterministic behavior',
    },
    messages: {
      noDateNow: 'Avoid Date.now(); inject a clock or time provider instead.',
      noNewDateNow: 'Avoid new Date(); inject a clock or pass explicit timestamps instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoDateNowListeners,
});

export default noDateNow;
