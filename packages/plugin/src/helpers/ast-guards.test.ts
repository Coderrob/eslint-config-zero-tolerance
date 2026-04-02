import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  isBinaryExpressionNode,
  isBlockStatementNode,
  isCallExpressionNode,
  isFunctionDeclarationNode,
  isIdentifierNode,
  isMemberExpressionNode,
  isMethodDefinitionNode,
  isNodeLike,
  isSwitchCaseNode,
  isTSEnumMemberNode,
  isTestFile,
  isUnaryExpressionNode,
  isVariableDeclarationNode,
  isVariableDeclaratorNode,
} from './ast-guards';

function createNode(type: AST_NODE_TYPES): TSESTree.Node {
  return { type } as unknown as TSESTree.Node;
}

describe('ast guards', () => {
  it('should identify binary expression nodes', () => {
    expect(isBinaryExpressionNode(createNode(AST_NODE_TYPES.BinaryExpression))).toBe(true);
    expect(isBinaryExpressionNode(createNode(AST_NODE_TYPES.CallExpression))).toBe(false);
  });

  it('should identify block statement nodes', () => {
    expect(isBlockStatementNode(createNode(AST_NODE_TYPES.BlockStatement))).toBe(true);
    expect(isBlockStatementNode(createNode(AST_NODE_TYPES.Identifier))).toBe(false);
  });

  it('should identify call expression nodes', () => {
    expect(isCallExpressionNode(createNode(AST_NODE_TYPES.CallExpression))).toBe(true);
    expect(isCallExpressionNode(createNode(AST_NODE_TYPES.BinaryExpression))).toBe(false);
  });

  it('should identify function declaration nodes', () => {
    expect(isFunctionDeclarationNode(createNode(AST_NODE_TYPES.FunctionDeclaration))).toBe(true);
    expect(isFunctionDeclarationNode(createNode(AST_NODE_TYPES.FunctionExpression))).toBe(false);
  });

  it('should identify identifier nodes', () => {
    expect(isIdentifierNode(createNode(AST_NODE_TYPES.Identifier))).toBe(true);
    expect(isIdentifierNode(createNode(AST_NODE_TYPES.Literal))).toBe(false);
  });

  it('should identify member expression nodes', () => {
    expect(isMemberExpressionNode(createNode(AST_NODE_TYPES.MemberExpression))).toBe(true);
    expect(isMemberExpressionNode(createNode(AST_NODE_TYPES.Identifier))).toBe(false);
  });

  it('should identify method definition nodes', () => {
    expect(isMethodDefinitionNode(createNode(AST_NODE_TYPES.MethodDefinition))).toBe(true);
    expect(isMethodDefinitionNode(createNode(AST_NODE_TYPES.Property))).toBe(false);
  });

  it('should identify node-like values', () => {
    expect(isNodeLike(createNode(AST_NODE_TYPES.Identifier))).toBe(true);
    expect(isNodeLike({ type: 'Identifier' })).toBe(true);
    expect(isNodeLike(null)).toBe(false);
    expect(isNodeLike(undefined)).toBe(false);
    expect(isNodeLike({ type: 42 })).toBe(false);
    expect(isNodeLike('string')).toBe(false);
  });

  it('should identify switch case nodes', () => {
    expect(isSwitchCaseNode(createNode(AST_NODE_TYPES.SwitchCase))).toBe(true);
    expect(isSwitchCaseNode(createNode(AST_NODE_TYPES.SwitchStatement))).toBe(false);
  });

  it('should identify enum member nodes', () => {
    expect(isTSEnumMemberNode(createNode(AST_NODE_TYPES.TSEnumMember))).toBe(true);
    expect(isTSEnumMemberNode(createNode(AST_NODE_TYPES.TSEnumDeclaration))).toBe(false);
  });

  it('should identify unary expression nodes', () => {
    expect(isUnaryExpressionNode(createNode(AST_NODE_TYPES.UnaryExpression))).toBe(true);
    expect(isUnaryExpressionNode(createNode(AST_NODE_TYPES.UpdateExpression))).toBe(false);
  });

  it('should identify variable declaration nodes', () => {
    expect(isVariableDeclarationNode(createNode(AST_NODE_TYPES.VariableDeclaration))).toBe(true);
    expect(isVariableDeclarationNode(createNode(AST_NODE_TYPES.VariableDeclarator))).toBe(false);
  });

  it('should identify variable declarator nodes', () => {
    expect(isVariableDeclaratorNode(createNode(AST_NODE_TYPES.VariableDeclarator))).toBe(true);
    expect(isVariableDeclaratorNode(createNode(AST_NODE_TYPES.VariableDeclaration))).toBe(false);
  });
});

describe('isTestFile', () => {
  it('should return true for test file suffixes', () => {
    expect(isTestFile('src/foo.test.ts')).toBe(true);
    expect(isTestFile('src/foo.spec.tsx')).toBe(true);
    expect(isTestFile('src/foo.test.mts')).toBe(true);
    expect(isTestFile('src/foo.spec.cjs')).toBe(true);
  });

  it('should return true for e2e and integration file suffixes', () => {
    expect(isTestFile('src/login.e2e.ts')).toBe(true);
    expect(isTestFile('src/auth.integration.ts')).toBe(true);
  });

  it('should return true for __tests__ directory paths', () => {
    expect(isTestFile('src/__tests__/foo.ts')).toBe(true);
    expect(isTestFile('src\\__tests__\\foo.ts')).toBe(true);
  });

  it('should return false for non-test files', () => {
    expect(isTestFile('src/foo.ts')).toBe(false);
    expect(isTestFile('src/test-utils.ts')).toBe(false);
  });
});
