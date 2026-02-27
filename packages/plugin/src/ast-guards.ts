/**
 * AST node type guards and related type aliases used across multiple rule
 * implementations. Each guard narrows a nullable or generic node to a
 * specific TSESTree type, eliminating raw `node.type === AST_NODE_TYPES.*`
 * comparisons from rule code.
 */

import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

// ── Shared type aliases ────────────────────────────────────────────────────

/** Union of all function-like AST nodes handled by function-scoped rules. */
export type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

// ── Test-file detection ────────────────────────────────────────────────────

const TEST_FILE_PATTERN = /\.(test|spec)\.[jt]sx?$/;

/**
 * Returns true when the filename matches a test or spec file convention.
 * @param filename - The filename to check.
 * @returns True if the filename is a test file, false otherwise.
 */
export function isTestFile(filename: string): boolean {
  return TEST_FILE_PATTERN.test(filename);
}

// ── Node type guards ───────────────────────────────────────────────────────

/**
 * Returns true when the node is an Identifier.
 * @param node - The node to check.
 * @returns True if the node is an Identifier, false otherwise.
 */
export function isIdentifierNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.Identifier {
  return node?.type === AST_NODE_TYPES.Identifier;
}

/**
 * Returns true when the node is a FunctionDeclaration.
 * @param node - The node to check.
 * @returns True if the node is a FunctionDeclaration, false otherwise.
 */
export function isFunctionDeclarationNode(
  node: TSESTree.Node,
): node is TSESTree.FunctionDeclaration {
  return node.type === AST_NODE_TYPES.FunctionDeclaration;
}

/**
 * Returns true when the node is a VariableDeclarator.
 * @param node - The node to check.
 * @returns True if the node is a VariableDeclarator, false otherwise.
 */
export function isVariableDeclaratorNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.VariableDeclarator {
  return node?.type === AST_NODE_TYPES.VariableDeclarator;
}

/**
 * Returns true when the node is a VariableDeclaration.
 * @param node - The node to check.
 * @returns True if the node is a VariableDeclaration, false otherwise.
 */
export function isVariableDeclarationNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.VariableDeclaration {
  return node?.type === AST_NODE_TYPES.VariableDeclaration;
}

/**
 * Returns true when the node is a MethodDefinition.
 * @param node - The node to check.
 * @returns True if the node is a MethodDefinition, false otherwise.
 */
export function isMethodDefinitionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MethodDefinition {
  return node?.type === AST_NODE_TYPES.MethodDefinition;
}

/**
 * Returns true when the node is a CallExpression.
 * @param node - The node to check.
 * @returns True if the node is a CallExpression, false otherwise.
 */
export function isCallExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.CallExpression {
  return node?.type === AST_NODE_TYPES.CallExpression;
}

/**
 * Returns true when the node is a MemberExpression.
 * @param node - The node to check.
 * @returns True if the node is a MemberExpression, false otherwise.
 */
export function isMemberExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MemberExpression {
  return node?.type === AST_NODE_TYPES.MemberExpression;
}

/**
 * Returns true when the node is a BlockStatement.
 * @param node - The node to check.
 * @returns True if the node is a BlockStatement, false otherwise.
 */
export function isBlockStatementNode(node: TSESTree.Node): node is TSESTree.BlockStatement {
  return node.type === AST_NODE_TYPES.BlockStatement;
}

/**
 * Returns true when the node is a BinaryExpression.
 * @param node - The node to check.
 * @returns True if the node is a BinaryExpression, false otherwise.
 */
export function isBinaryExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.BinaryExpression {
  return node?.type === AST_NODE_TYPES.BinaryExpression;
}

/**
 * Returns true when the node is a SwitchCase.
 * @param node - The node to check.
 * @returns True if the node is a SwitchCase, false otherwise.
 */
export function isSwitchCaseNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.SwitchCase {
  return node?.type === AST_NODE_TYPES.SwitchCase;
}

/**
 * Returns true when the node is a UnaryExpression.
 * @param node - The node to check.
 * @returns True if the node is a UnaryExpression, false otherwise.
 */
export function isUnaryExpressionNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.UnaryExpression {
  return node?.type === AST_NODE_TYPES.UnaryExpression;
}

/**
 * Returns true when the node is a TSEnumMember.
 * @param node - The node to check.
 * @returns True if the node is a TSEnumMember, false otherwise.
 */
export function isTSEnumMemberNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.TSEnumMember {
  return node?.type === AST_NODE_TYPES.TSEnumMember;
}
