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
 * Higher-level AST search helpers built on visitor-key traversal.
 */

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getVisitorChildNodes } from '../ast-helpers';

const LAST_ITEM_OFFSET = 1;

/**
 * Returns the first descendant node that satisfies the predicate, or null.
 *
 * The root node participates in matching. When a stop predicate is provided,
 * nodes that satisfy it are not traversed further.
 *
 * @param node - Root node to search.
 * @param sourceCode - ESLint source code helper.
 * @param predicate - Match predicate for descendant nodes.
 * @param stopPredicate - Optional traversal-stop predicate.
 * @returns First matching descendant node, or null when no match exists.
 */
export function findDescendant<T extends TSESTree.Node>(
  node: Readonly<TSESTree.Node>,
  sourceCode: Readonly<Pick<TSESLint.SourceCode, 'visitorKeys'>>,
  predicate: (candidate: TSESTree.Node) => candidate is T,
  stopPredicate?: (candidate: TSESTree.Node) => boolean,
): T | null {
  let pendingNodes: ReadonlyArray<TSESTree.Node> = [node];
  while (hasPendingNodes(pendingNodes)) {
    const currentNode = getLastPendingNode(pendingNodes);
    const remainingNodes = pendingNodes.slice(0, -LAST_ITEM_OFFSET);
    if (predicate(currentNode)) {
      return currentNode;
    }
    pendingNodes = getNextPendingNodes(remainingNodes, currentNode, sourceCode, stopPredicate);
  }
  return null;
}

/**
 * Returns the next node to inspect from the search stack.
 *
 * @param pendingNodes - Remaining nodes to search.
 * @returns Next node to inspect.
 */
function getLastPendingNode(pendingNodes: ReadonlyArray<TSESTree.Node>): TSESTree.Node {
  return pendingNodes[pendingNodes.length - LAST_ITEM_OFFSET];
}

/**
 * Returns the next search stack after visiting the current node.
 *
 * @param remainingNodes - Remaining nodes to search.
 * @param currentNode - Current node being inspected.
 * @param sourceCode - ESLint source code helper.
 * @param stopPredicate - Optional traversal-stop predicate.
 * @returns Updated search stack.
 */
function getNextPendingNodes(
  remainingNodes: ReadonlyArray<TSESTree.Node>,
  currentNode: Readonly<TSESTree.Node>,
  sourceCode: Readonly<Pick<TSESLint.SourceCode, 'visitorKeys'>>,
  stopPredicate: ((candidate: TSESTree.Node) => boolean) | undefined,
): ReadonlyArray<TSESTree.Node> {
  if (stopPredicate?.(currentNode) ?? false) {
    return remainingNodes;
  }
  return [...remainingNodes, ...getVisitorChildNodes(currentNode, sourceCode)];
}

/**
 * Returns true when any descendant node satisfies the predicate.
 *
 * @param node - Root node to search.
 * @param sourceCode - ESLint source code helper.
 * @param predicate - Match predicate for descendant nodes.
 * @param stopPredicate - Optional traversal-stop predicate.
 * @returns True when a matching descendant exists.
 */
export function hasDescendant<T extends TSESTree.Node>(
  node: Readonly<TSESTree.Node>,
  sourceCode: Readonly<Pick<TSESLint.SourceCode, 'visitorKeys'>>,
  predicate: (candidate: TSESTree.Node) => candidate is T,
  stopPredicate?: (candidate: TSESTree.Node) => boolean,
): boolean {
  return findDescendant(node, sourceCode, predicate, stopPredicate) !== null;
}

/**
 * Returns true when the search stack still contains nodes to visit.
 *
 * @param pendingNodes - Remaining nodes to search.
 * @returns True when at least one node remains.
 */
function hasPendingNodes(pendingNodes: ReadonlyArray<TSESTree.Node>): boolean {
  return pendingNodes.length > 0;
}
