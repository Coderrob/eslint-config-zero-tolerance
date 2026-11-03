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

type TransparentExpression =
  | TSESTree.TSAsExpression
  | TSESTree.TSSatisfiesExpression
  | TSESTree.TSTypeAssertion
  | TSESTree.TSNonNullExpression;

const VARIABLE_DEFINITION = 'Variable';
const TRANSPARENT_EXPRESSIONS = new Set([
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.TSTypeAssertion,
  AST_NODE_TYPES.TSNonNullExpression,
]);

/**
 * Resolves the lexical binding of an identifier.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
export function findBinding(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Identifier>,
): TSESLint.Scope.Variable | null {
  return findInScope(source.getScope(node), node.name);
}

/**
 * Searches enclosing lexical scopes for a binding.
 * @param scope - Lexical scope to inspect.
 * @param name - Name to resolve.
 * @returns The result of the described check or resolution.
 */
function findInScope(
  scope: TSESLint.Scope.Scope | null,
  name: string,
): TSESLint.Scope.Variable | null {
  if (scope === null) return null;
  return scope.set.get(name) ?? findInScope(scope.upper, name);
}

/**
 * Reads a positional argument without assuming that optional arguments exist.
 * @param node - AST node to inspect.
 * @param index - Zero-based argument position.
 * @returns The result of the described check or resolution.
 */
export function getArgument(
  node: Readonly<TSESTree.CallExpression | TSESTree.NewExpression>,
  index: number,
): TSESTree.CallExpressionArgument | null {
  return node.arguments.find((_argument, position) => position === index) ?? null;
}

/**
 * Returns the initializer of an unreassigned simple variable.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
export function getStableInitializer(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Identifier>,
): TSESTree.Expression | null {
  const binding = findBinding(source, node);
  if (binding === null || binding.references.some(isReassignment)) return null;
  return variableInitializer(binding.defs[0] ?? null);
}

/**
 * Identifies writes after a variable's initialization.
 * @param reference - Reference to the local binding.
 * @returns The result of the described check or resolution.
 */
function isReassignment(reference: Readonly<TSESLint.Scope.Reference>): boolean {
  return reference.isWrite() && reference.init !== true;
}

/** Identifies TypeScript wrappers that preserve the runtime value.
 * @param node - Candidate expression.
 * @returns Whether the node wraps an unchanged runtime expression.
 */
function isTransparentExpression(node: Readonly<TSESTree.Node>): node is TransparentExpression {
  return TRANSPARENT_EXPRESSIONS.has(node.type);
}

/**
 * Unwraps one assertion or stable identifier.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function nextLocalValue(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
): TSESTree.Node | null {
  if (node.type === AST_NODE_TYPES.Identifier) return getStableInitializer(source, node);
  if (isTransparentExpression(node)) return node.expression;
  return null;
}

/**
 * Resolves local initializer aliases without following cycles.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param seen - Nodes already visited during resolution.
 * @returns The result of the described check or resolution.
 */
export function resolveLocalValue(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
  seen: readonly TSESTree.Node[] = [],
): TSESTree.Node {
  if (seen.includes(node)) return node;
  const next = nextLocalValue(source, node);
  return next === null ? node : resolveLocalValue(source, next, [...seen, node]);
}

/** Removes TypeScript wrappers without following identifier aliases.
 * @param node - Expression whose runtime syntax is needed.
 * @returns The underlying node, preserving identifier binding identity.
 */
export function unwrapTypeExpression(node: Readonly<TSESTree.Node>): TSESTree.Node {
  return isTransparentExpression(node) ? unwrapTypeExpression(node.expression) : node;
}

/**
 * Returns a simple variable initializer.
 * @param definition - Variable or import definition.
 * @returns The result of the described check or resolution.
 */
function variableInitializer(
  definition: TSESLint.Scope.Definition | null,
): TSESTree.Expression | null {
  if (definition === null || definition.type !== VARIABLE_DEFINITION) return null;
  return definition.node.id.type === AST_NODE_TYPES.Identifier ? definition.node.init : null;
}
