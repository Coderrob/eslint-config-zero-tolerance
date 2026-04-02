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

/**
 * Appends traversable children for the current search node.
 *
 * @param pendingNodes - Remaining nodes to search.
 * @param currentNode - Current node being inspected.
 * @param sourceCode - ESLint source code helper.
 * @param stopPredicate - Optional traversal-stop predicate.
 */
function appendSearchChildren(
  pendingNodes: TSESTree.Node[],
  currentNode: TSESTree.Node,
  sourceCode: Pick<TSESLint.SourceCode, 'visitorKeys'>,
  stopPredicate: ((candidate: TSESTree.Node) => boolean) | undefined,
): void {
  if (stopPredicate?.(currentNode) ?? false) {
    return;
  }
  pendingNodes.push(...getVisitorChildNodes(currentNode, sourceCode));
}

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
  node: TSESTree.Node,
  sourceCode: Pick<TSESLint.SourceCode, 'visitorKeys'>,
  predicate: (candidate: TSESTree.Node) => candidate is T,
  stopPredicate?: (candidate: TSESTree.Node) => boolean,
): T | null {
  const pendingNodes: TSESTree.Node[] = [node];
  while (hasPendingNodes(pendingNodes)) {
    const currentNode = popPendingNode(pendingNodes);
    if (predicate(currentNode)) {
      return currentNode;
    }
    appendSearchChildren(pendingNodes, currentNode, sourceCode, stopPredicate);
  }
  return null;
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

/**
 * Removes and returns the next node to inspect from the search stack.
 *
 * @param pendingNodes - Remaining nodes to search.
 * @returns Next node to inspect.
 */
function popPendingNode(pendingNodes: TSESTree.Node[]): TSESTree.Node {
  const lastIndex = pendingNodes.length - 1;
  const currentNode = pendingNodes[lastIndex];
  pendingNodes.length = lastIndex;
  return currentNode;
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
export function someDescendant<T extends TSESTree.Node>(
  node: TSESTree.Node,
  sourceCode: Pick<TSESLint.SourceCode, 'visitorKeys'>,
  predicate: (candidate: TSESTree.Node) => candidate is T,
  stopPredicate?: (candidate: TSESTree.Node) => boolean,
): boolean {
  return findDescendant(node, sourceCode, predicate, stopPredicate) !== null;
}
