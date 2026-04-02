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
 * Shared JSDoc-comment helper functions used by JSDoc-enforcement rules.
 */

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils';
import { JSDOC_BLOCK_MARKER } from '../rules/support/rule-constants';
import { type FunctionNode, isVariableDeclaratorNode } from './ast-guards';

const PARENT_OWNED_TARGET_TYPES = new Set([
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.Property,
]);

/**
 * Returns the nearest JSDoc block comment preceding the given node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node to inspect.
 * @returns The nearest JSDoc block, or null.
 */
export function getJsdocComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): TSESTree.Comment | null {
  const comments = sourceCode.getCommentsBefore(node);
  const jsdocComments = comments.filter(isJsdocBlockComment);
  return jsdocComments.at(-1) ?? null;
}

/**
 * Returns the indentation prefix for the line containing the node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node whose line indentation should be read.
 * @returns Whitespace indentation prefix.
 */
export function getLineIndentation(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): string {
  const lineText = sourceCode.lines[node.loc.start.line - 1] ?? '';
  return lineText.slice(0, lineText.length - lineText.trimStart().length);
}

/**
 * Returns method and property parent nodes that own JSDoc placement.
 *
 * @param node - Function node.
 * @returns Parent node if it owns JSDoc, otherwise null.
 */
export function getParentOwnedTargetNode(node: FunctionNode): TSESTree.Node | null {
  if (!isParentOwnedTargetType(node.parent.type)) {
    return null;
  }
  return node.parent;
}

/**
 * Returns the node that should own the JSDoc comment for the function.
 *
 * @param node - Function node to inspect.
 * @returns Target node for JSDoc placement.
 */
export function getTargetNode(node: FunctionNode): TSESTree.Node {
  return getParentOwnedTargetNode(node) ?? getVariableOwnedTargetNode(node) ?? node;
}

/**
 * Returns variable-related target node for JSDoc ownership when applicable.
 *
 * @param node - Function node.
 * @returns JSDoc owner target node, or null.
 */
export function getVariableOwnedTargetNode(node: FunctionNode): TSESTree.Node | null {
  if (!isVariableDeclaratorNode(node.parent)) {
    return null;
  }
  const declaration = node.parent.parent;
  if (declaration.declarations.length !== 1) {
    return node.parent;
  }
  return declaration.parent.type === AST_NODE_TYPES.ExportNamedDeclaration
    ? declaration.parent
    : declaration;
}

/**
 * Returns true when a comment token is a JSDoc block.
 *
 * @param comment - Comment token to inspect.
 * @returns True when the token is a JSDoc block comment.
 */
export function isJsdocBlockComment(comment: TSESTree.Comment): boolean {
  return comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith(JSDOC_BLOCK_MARKER);
}

/**
 * Returns true when a parent node type owns JSDoc placement for enclosed functions.
 *
 * @param type - Node type to inspect.
 * @returns True when the node type owns JSDoc placement.
 */
export function isParentOwnedTargetType(type: AST_NODE_TYPES): boolean {
  return PARENT_OWNED_TARGET_TYPES.has(type);
}

/**
 * Returns true when a node starts on its own line with only indentation before it.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node that would receive an inserted JSDoc block.
 * @returns True when inserting before the node is formatting-safe.
 */
export function isStandaloneLineTarget(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): boolean {
  const lineText = sourceCode.lines[node.loc.start.line - 1] ?? '';
  const prefix = lineText.slice(0, node.loc.start.column);
  return prefix.trim().length === 0;
}
