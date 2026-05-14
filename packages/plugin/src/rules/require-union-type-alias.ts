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

type RequireUnionTypeAliasContext = Readonly<TSESLint.RuleContext<'requireUnionTypeAlias', []>>;

const MIN_UNION_MEMBERS = 3;
const MIN_TYPE_REFERENCES = 2;

/**
 * Reports a union type node when it contains multiple type reference members
 * and is not already a direct type alias declaration.
 *
 * @param context - ESLint rule execution context.
 * @param node - The union type node to inspect.
 */
function checkUnionType(
  context: Readonly<RequireUnionTypeAliasContext>,
  node: Readonly<TSESTree.TSUnionType>,
): void {
  if (isDirectTypeAlias(node)) {
    return;
  }
  if (
    countNonNullishUnionMembers(node.types) < MIN_UNION_MEMBERS ||
    countTypeReferences(node.types) < MIN_TYPE_REFERENCES
  ) {
    return;
  }
  context.report({ node, messageId: 'requireUnionTypeAlias' });
}

/**
 * Counts union members excluding nullish absence markers.
 *
 * @param types - Union type members to inspect.
 * @returns Number of non-nullish union members.
 */
function countNonNullishUnionMembers(types: readonly TSESTree.TypeNode[]): number {
  return types.filter(isNonNullishUnionMember).length;
}

/**
 * Counts the number of type reference members in a union type.
 *
 * @param types - Union type members to inspect.
 * @returns Number of type reference members.
 */
function countTypeReferences(types: readonly TSESTree.TypeNode[]): number {
  let count = 0;
  for (const member of types) {
    if (member.type === AST_NODE_TYPES.TSTypeReference) {
      count += 1;
    }
  }
  return count;
}

/**
 * Creates listeners for inline union type alias checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createRequireUnionTypeAliasListeners(
  context: Readonly<RequireUnionTypeAliasContext>,
): TSESLint.RuleListener {
  return {
    TSUnionType: checkUnionType.bind(undefined, context),
  };
}

/**
 * Returns true when the union type is the direct value of a type alias declaration.
 *
 * @param node - Union type node to inspect.
 * @returns True when the union is already extracted to a type alias.
 */
function isDirectTypeAlias(node: Readonly<TSESTree.TSUnionType>): boolean {
  return node.parent.type === AST_NODE_TYPES.TSTypeAliasDeclaration;
}

/**
 * Returns true when a union member is only a nullish absence marker.
 *
 * @param member - Union member to inspect.
 * @returns True when the member is null or undefined.
 */
function isNonNullishUnionMember(member: Readonly<TSESTree.TypeNode>): boolean {
  return (
    member.type !== AST_NODE_TYPES.TSNullKeyword &&
    member.type !== AST_NODE_TYPES.TSUndefinedKeyword
  );
}

/**
 * ESLint rule that requires inline union types with three or more members
 * to be extracted into named type aliases.
 */
export const requireUnionTypeAlias = createRule({
  name: 'require-union-type-alias',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require inline union types with three or more members and multiple type references to be extracted into named type aliases',
    },
    messages: {
      requireUnionTypeAlias: 'Replace this inline union type with a named type alias.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireUnionTypeAliasListeners,
});

export default requireUnionTypeAlias;
