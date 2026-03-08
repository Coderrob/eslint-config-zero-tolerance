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

import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../rule-factory';
import { isBoolean } from '../type-guards';

type NoLiteralUnionsContext = Readonly<TSESLint.RuleContext<'noLiteralUnions', []>>;
const BANNED_LITERAL_NODE_TYPES = new Set([AST_NODE_TYPES.Literal, AST_NODE_TYPES.TemplateLiteral]);

/**
 * Checks union types and reports banned literal unions.
 *
 * @param context - ESLint rule execution context.
 * @param node - Union type node to inspect.
 */
function checkUnionType(context: NoLiteralUnionsContext, node: TSESTree.TSUnionType): void {
  if (isBooleanLiteralUnion(node)) {
    return;
  }
  if (!hasBannedLiteralUnionMember(node)) {
    return;
  }
  context.report({
    node,
    messageId: 'noLiteralUnions',
  });
}

/**
 * Creates listeners for literal-union checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoLiteralUnionsListeners(context: NoLiteralUnionsContext): TSESLint.RuleListener {
  return {
    TSUnionType: checkUnionType.bind(undefined, context),
  };
}

/**
 * Returns true when a union includes any banned literal member.
 *
 * @param node - Union type node to inspect.
 * @returns True when the union should be reported.
 */
function hasBannedLiteralUnionMember(node: TSESTree.TSUnionType): boolean {
  return node.types.some(isBannedLiteralUnionMember);
}

/**
 * Returns true when a literal union member is banned by this rule.
 *
 * @param type - Union member type node.
 * @returns True when the member is a string/number/bigint/template literal.
 */
function isBannedLiteralUnionMember(type: TSESTree.TypeNode): boolean {
  if (!isLiteralTypeNode(type)) {
    return false;
  }
  return BANNED_LITERAL_NODE_TYPES.has(type.literal.type);
}

/**
 * Returns true when a type node represents a boolean literal type.
 *
 * @param type - Type node to inspect.
 * @returns True when the type is a `true`/`false` literal.
 */
function isBooleanLiteralType(type: TSESTree.TypeNode): boolean {
  return (
    isLiteralTypeNode(type) &&
    type.literal.type === AST_NODE_TYPES.Literal &&
    isBoolean(type.literal.value)
  );
}

/**
 * Returns true when all union members are boolean literals.
 *
 * @param node - Union type node to inspect.
 * @returns True for `true | false` style unions.
 */
function isBooleanLiteralUnion(node: TSESTree.TSUnionType): boolean {
  return node.types.every(isBooleanLiteralType);
}

/**
 * Returns true when a type node is a literal type.
 *
 * @param type - Type node to inspect.
 * @returns True when the node is a `TSLiteralType`.
 */
function isLiteralTypeNode(type: TSESTree.TypeNode): type is TSESTree.TSLiteralType {
  return type.type === AST_NODE_TYPES.TSLiteralType;
}

/**
 * ESLint rule that prohibits literal unions in favor of enums.
 */
export const noLiteralUnions = createRule({
  name: 'no-literal-unions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ban literal unions in favor of enums',
    },
    messages: {
      noLiteralUnions: 'Literal unions are not allowed, use an enum instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoLiteralUnionsListeners,
});

export default noLiteralUnions;
