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
 * Higher-level AST navigation helpers for ancestry and sibling traversal.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { FunctionNode } from '../ast-guards';

const FUNCTION_NODE_TYPES = new Set([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

/**
 * Returns the nearest ancestor that satisfies the provided predicate.
 *
 * @param node - Starting node.
 * @param predicate - Ancestor match predicate.
 * @returns Matching ancestor, or null when none exists.
 */
export function findAncestor<T extends TSESTree.Node>(
  node: Readonly<TSESTree.Node>,
  predicate: (candidate: TSESTree.Node) => candidate is T,
): T | null {
  let currentNode = node.parent;
  while (currentNode !== undefined) {
    if (predicate(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.parent;
  }
  return null;
}

/**
 * Returns the nearest enclosing function-like ancestor.
 *
 * @param node - Starting node.
 * @returns Enclosing function-like node, or null when none exists.
 */
export function findEnclosingFunction(node: Readonly<TSESTree.Node>): FunctionNode | null {
  let currentNode = node.parent;
  while (currentNode !== undefined) {
    if (isFunctionNode(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.parent;
  }
  return null;
}

/**
 * Returns the next statement that follows a node inside a block statement.
 *
 * @param blockStatement - Block statement containing the node.
 * @param node - Statement to locate.
 * @returns Following statement, or null when none exists.
 */
export function getNextStatementInBlock(
  blockStatement: Readonly<TSESTree.BlockStatement>,
  node: Readonly<TSESTree.Statement>,
): TSESTree.Statement | null {
  const nextIndex = blockStatement.body.indexOf(node) + 1;
  return blockStatement.body[nextIndex] ?? null;
}

/**
 * Returns the parent block statement for a statement node.
 *
 * @param node - Statement node.
 * @returns Parent block statement, or null when the parent is not a block.
 */
export function getParentBlockStatement(
  node: Readonly<TSESTree.Statement>,
): TSESTree.BlockStatement | null {
  const parent = node.parent;
  return parent.type === AST_NODE_TYPES.BlockStatement ? parent : null;
}

/**
 * Returns true when a node is one of the standard function-like AST variants.
 *
 * @param node - Node to inspect.
 * @returns True for function-like nodes handled by shared rule helpers.
 */
function isFunctionNode(node: Readonly<TSESTree.Node>): node is FunctionNode {
  return FUNCTION_NODE_TYPES.has(node.type);
}

/**
 * Returns true when a matching boundary is encountered before any stop boundary.
 *
 * Ancestors are expected in the same order as `SourceCode#getAncestors`, from
 * outermost to innermost. Evaluation proceeds from the innermost ancestor back
 * toward the root so the nearest relevant boundary wins.
 *
 * @param ancestors - Ancestor nodes to inspect.
 * @param matchTypes - Boundary types that count as a positive match.
 * @param stopTypes - Boundary types that terminate the search negatively.
 * @returns True when a match boundary is reached before a stop boundary.
 */
export function isInsideBoundary(
  ancestors: ReadonlyArray<TSESTree.Node>,
  matchTypes: Readonly<ReadonlySet<AST_NODE_TYPES>>,
  stopTypes: Readonly<ReadonlySet<AST_NODE_TYPES>>,
): boolean {
  return isInsideBoundaryAtIndex(ancestors, matchTypes, stopTypes, ancestors.length - 1);
}

/**
 * Recursively checks ancestors from innermost to outermost for a matching boundary.
 *
 * @param ancestors - Ancestor nodes to inspect.
 * @param matchTypes - Boundary types that count as a positive match.
 * @param stopTypes - Boundary types that terminate the search negatively.
 * @param index - Current ancestor index.
 * @returns True when a match boundary is reached before a stop boundary.
 */
function isInsideBoundaryAtIndex(
  ancestors: ReadonlyArray<TSESTree.Node>,
  matchTypes: Readonly<ReadonlySet<AST_NODE_TYPES>>,
  stopTypes: Readonly<ReadonlySet<AST_NODE_TYPES>>,
  index: number,
): boolean {
  if (index < 0) {
    return false;
  }
  const ancestorType = ancestors[index].type;
  if (stopTypes.has(ancestorType)) {
    return false;
  }
  if (matchTypes.has(ancestorType)) {
    return true;
  }
  return isInsideBoundaryAtIndex(ancestors, matchTypes, stopTypes, index - 1);
}
