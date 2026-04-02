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
 * AST node type guards and related type aliases used across multiple rule
 * implementations.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/** Union of all function-like AST nodes handled by function-scoped rules. */
export type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const TEST_FILE_PATTERN = /\.(test|spec|e2e|integration)\.[cm]?[jt]sx?$/;
const TEST_DIRECTORY_SEGMENT = '/__tests__/';

/**
 * Returns true when the node is a BinaryExpression.
 *
 * @param node - The node to check.
 * @returns True if the node is a BinaryExpression, false otherwise.
 */
export function isBinaryExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.BinaryExpression {
  return node?.type === AST_NODE_TYPES.BinaryExpression;
}

/**
 * Returns true when the node is a BlockStatement.
 *
 * @param node - The node to check.
 * @returns True if the node is a BlockStatement, false otherwise.
 */
export function isBlockStatementNode(node: TSESTree.Node): node is TSESTree.BlockStatement {
  return node.type === AST_NODE_TYPES.BlockStatement;
}

/**
 * Returns true when the node is a CallExpression.
 *
 * @param node - The node to check.
 * @returns True if the node is a CallExpression, false otherwise.
 */
export function isCallExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.CallExpression {
  return node?.type === AST_NODE_TYPES.CallExpression;
}

/**
 * Returns true when the node is a FunctionDeclaration.
 *
 * @param node - The node to check.
 * @returns True if the node is a FunctionDeclaration, false otherwise.
 */
export function isFunctionDeclarationNode(
  node: TSESTree.Node,
): node is TSESTree.FunctionDeclaration {
  return node.type === AST_NODE_TYPES.FunctionDeclaration;
}

/**
 * Returns true when the node is an Identifier.
 *
 * @param node - The node to check.
 * @returns True if the node is an Identifier, false otherwise.
 */
export function isIdentifierNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.Identifier {
  return node?.type === AST_NODE_TYPES.Identifier;
}

/**
 * Returns true when the node is a MemberExpression.
 *
 * @param node - The node to check.
 * @returns True if the node is a MemberExpression, false otherwise.
 */
export function isMemberExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MemberExpression {
  return node?.type === AST_NODE_TYPES.MemberExpression;
}

/**
 * Returns true when the node is a MethodDefinition.
 *
 * @param node - The node to check.
 * @returns True if the node is a MethodDefinition, false otherwise.
 */
export function isMethodDefinitionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MethodDefinition {
  return node?.type === AST_NODE_TYPES.MethodDefinition;
}

/**
 * Returns true when the node is an Identifier with the expected name.
 *
 * @param node - The node to check.
 * @param name - Expected identifier name.
 * @returns True if the node is an Identifier with the expected name, false otherwise.
 */
export function isNamedIdentifierNode(
  node: TSESTree.Node | null | undefined,
  name: string,
): node is TSESTree.Identifier {
  return isIdentifierNode(node) && node.name === name;
}

/**
 * Returns true when an unknown value is an AST node.
 *
 * @param value - Value to inspect.
 * @returns True when value has a node-like `type` property.
 */
export function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
  );
}

/**
 * Returns true when the node is a SwitchCase.
 *
 * @param node - The node to check.
 * @returns True if the node is a SwitchCase, false otherwise.
 */
export function isSwitchCaseNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.SwitchCase {
  return node?.type === AST_NODE_TYPES.SwitchCase;
}

/**
 * Returns true when the filename matches a test or spec file convention.
 *
 * @param filename - The filename to check.
 * @returns True if the filename is a test file, false otherwise.
 */
export function isTestFile(filename: string): boolean {
  const normalizedFilename = filename.replace(/\\/g, '/').toLowerCase();
  return (
    normalizedFilename.includes(TEST_DIRECTORY_SEGMENT) ||
    TEST_FILE_PATTERN.test(normalizedFilename)
  );
}

/**
 * Returns true when the node is a TSEnumMember.
 *
 * @param node - The node to check.
 * @returns True if the node is a TSEnumMember, false otherwise.
 */
export function isTSEnumMemberNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.TSEnumMember {
  return node?.type === AST_NODE_TYPES.TSEnumMember;
}

/**
 * Returns true when the node is a UnaryExpression.
 *
 * @param node - The node to check.
 * @returns True if the node is a UnaryExpression, false otherwise.
 */
export function isUnaryExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.UnaryExpression {
  return node?.type === AST_NODE_TYPES.UnaryExpression;
}

/**
 * Returns true when the node is a non-computed MemberExpression.
 *
 * @param node - The node to check.
 * @returns True if the node is a direct member access, false otherwise.
 */
export function isUncomputedMemberExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MemberExpression & {
  computed: false;
  object: TSESTree.Expression;
  property: TSESTree.Expression | TSESTree.PrivateIdentifier;
} {
  return isMemberExpressionNode(node) && !node.computed;
}

/**
 * Returns true when the node is a VariableDeclaration.
 *
 * @param node - The node to check.
 * @returns True if the node is a VariableDeclaration, false otherwise.
 */
export function isVariableDeclarationNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.VariableDeclaration {
  return node?.type === AST_NODE_TYPES.VariableDeclaration;
}

/**
 * Returns true when the node is a VariableDeclarator.
 *
 * @param node - The node to check.
 * @returns True if the node is a VariableDeclarator, false otherwise.
 */
export function isVariableDeclaratorNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.VariableDeclarator {
  return node?.type === AST_NODE_TYPES.VariableDeclarator;
}
