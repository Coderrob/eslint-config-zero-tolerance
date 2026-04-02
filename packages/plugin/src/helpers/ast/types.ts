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

/**
 * Higher-level AST helpers for TypeScript type and wrapper-node evaluation.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/**
 * Returns the first type argument for a type reference, or null.
 *
 * @param node - Type-reference node.
 * @returns First type argument when present, otherwise null.
 */
export function getFirstTypeArgument(node: TSESTree.TSTypeReference): TSESTree.TypeNode | null {
  return node.typeArguments?.params[0] ?? null;
}

/**
 * Returns the unqualified identifier name of a type reference, or null.
 *
 * @param node - Type-reference node.
 * @returns Identifier name for simple type references, or null for qualified names.
 */
export function getTypeReferenceName(node: TSESTree.TSTypeReference): string | null {
  return node.typeName.type === AST_NODE_TYPES.Identifier ? node.typeName.name : null;
}

/**
 * Returns true when every member of a type literal is a readonly property signature.
 *
 * @param node - Type-literal node.
 * @returns True when all members are readonly properties.
 */
export function hasAllReadonlyPropertyMembers(node: TSESTree.TSTypeLiteral): boolean {
  for (const member of node.members) {
    if (member.type !== AST_NODE_TYPES.TSPropertySignature || !member.readonly) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true when a type reference matches a simple identifier name and has type arguments.
 *
 * @param node - Type-reference node.
 * @param expectedName - Expected simple type-reference name.
 * @returns True when the type reference name matches and type arguments are present.
 */
export function hasNamedTypeReferenceWithTypeArguments(
  node: TSESTree.TSTypeReference,
  expectedName: string,
): node is TSESTree.TSTypeReference & {
  typeArguments: TSESTree.TSTypeParameterInstantiation & {
    params: [TSESTree.TypeNode, ...TSESTree.TypeNode[]];
  };
} {
  return isNamedTypeReference(node, expectedName) && hasTypeArguments(node);
}

/**
 * Returns true when a type reference has at least one type argument.
 *
 * @param node - Type-reference node.
 * @returns True when type arguments exist.
 */
export function hasTypeArguments(node: TSESTree.TSTypeReference): boolean {
  return node.typeArguments !== undefined && node.typeArguments.params.length > 0;
}

/**
 * Returns true when a type reference resolves to the provided simple identifier name.
 *
 * @param node - Type-reference node.
 * @param expectedName - Expected simple type-reference name.
 * @returns True when the type reference is a simple identifier with the expected name.
 */
export function isNamedTypeReference(
  node: TSESTree.TSTypeReference,
  expectedName: string,
): boolean {
  return getTypeReferenceName(node) === expectedName;
}

/**
 * Returns true when an expression is a TypeScript wrapper expression.
 *
 * @param expression - Expression to inspect.
 * @returns True when the expression wraps another runtime expression.
 */
function isTsWrapperExpression(
  expression: TSESTree.Expression,
): expression is
  | TSESTree.TSAsExpression
  | TSESTree.TSNonNullExpression
  | TSESTree.TSSatisfiesExpression {
  return (
    expression.type === AST_NODE_TYPES.TSAsExpression ||
    expression.type === AST_NODE_TYPES.TSNonNullExpression ||
    expression.type === AST_NODE_TYPES.TSSatisfiesExpression
  );
}

/**
 * Recursively unwraps TypeScript wrapper expressions around a runtime expression.
 *
 * Supports `as`, `satisfies`, and non-null wrapper expressions.
 *
 * @param expression - Expression to unwrap.
 * @returns Innermost wrapped runtime expression.
 */
export function unwrapTsExpression(expression: TSESTree.Expression): TSESTree.Expression {
  let currentExpression = expression;
  while (isTsWrapperExpression(currentExpression)) {
    currentExpression = currentExpression.expression;
  }
  return currentExpression;
}
