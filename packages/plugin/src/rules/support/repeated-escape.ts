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

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

const FUNCTION_BOUNDARIES = new Set([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
]);

/** Tests source-range containment for nodes in the same file.
 * @param outer - Enclosing node.
 * @param inner - Candidate descendant.
 * @returns Whether the inner node belongs to the enclosing syntax region.
 */
function isNodeContained(outer: Readonly<TSESTree.Node>, inner: Readonly<TSESTree.Node>): boolean {
  return outer.range[0] <= inner.range[0] && inner.range[1] <= outer.range[1];
}

/** Matches a loop whose body does not recreate the container before each write.
 * @param node - Enclosing AST node.
 * @param allocation - Container initializer.
 * @param escape - Escaping reference.
 * @returns Whether the container survives an iteration containing the escape.
 */
function isPersistentLoopEscape(
  node: Readonly<TSESTree.Node>,
  allocation: Readonly<TSESTree.Node>,
  escape: Readonly<TSESTree.Node>,
): boolean {
  const body = loopBody(node);
  if (body === null) return false;
  return isNodeContained(node, escape) && !isNodeContained(body, allocation);
}

/** Checks whether a later escape can precede a write on another loop iteration.
 * @param allocation - Container initializer.
 * @param write - Mutation expression.
 * @param escape - Reference that publishes or aliases the container.
 * @returns Whether a shared loop repeats the write without reallocating the container.
 */
export function isRepeatedEscape(
  allocation: Readonly<TSESTree.Node>,
  write: Readonly<TSESTree.Node>,
  escape: Readonly<TSESTree.Node>,
): boolean {
  const parent = write.parent;
  if (parent == null || FUNCTION_BOUNDARIES.has(parent.type)) return false;
  if (isPersistentLoopEscape(parent, allocation, escape)) return true;
  return isRepeatedEscape(allocation, parent, escape);
}

/** Reads loop bodies without crossing unrelated statements.
 * @param node - Candidate loop.
 * @returns The repeated body, or null for non-loop nodes.
 */
function loopBody(node: Readonly<TSESTree.Node>): TSESTree.Statement | null {
  if (node.type === AST_NODE_TYPES.ForStatement) return node.body;
  if (node.type === AST_NODE_TYPES.ForInStatement || node.type === AST_NODE_TYPES.ForOfStatement)
    return node.body;
  return whileBody(node);
}

/** Reads while and do-while bodies.
 * @param node - Candidate loop.
 * @returns The repeated body, or null when unsupported.
 */
function whileBody(node: Readonly<TSESTree.Node>): TSESTree.Statement | null {
  if (node.type === AST_NODE_TYPES.WhileStatement || node.type === AST_NODE_TYPES.DoWhileStatement)
    return node.body;
  return null;
}
