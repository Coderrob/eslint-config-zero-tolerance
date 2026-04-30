import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import {
  findAncestor,
  findEnclosingFunction,
  getNextStatementInBlock,
  getParentBlockStatement,
  isInsideBoundary,
} from './navigation';

describe('ast navigation helpers', () => {
  describe('findAncestor', () => {
    it('should return the nearest matching ancestor', () => {
      const program = { type: AST_NODE_TYPES.Program } as unknown;
      const block = { type: AST_NODE_TYPES.BlockStatement, parent: program } as unknown;
      const statement = { type: AST_NODE_TYPES.ExpressionStatement, parent: block } as unknown;
      const node = { type: AST_NODE_TYPES.Identifier, parent: statement } as unknown;

      const result = findAncestor(
        node,
        (candidate): candidate is TSESTree.BlockStatement =>
          candidate.type === AST_NODE_TYPES.BlockStatement,
      );

      expect(result).toBe(block);
    });

    it('should return null when no ancestor matches', () => {
      const node = { type: AST_NODE_TYPES.Identifier } as unknown;

      const result = findAncestor(
        node,
        (candidate): candidate is TSESTree.BlockStatement =>
          candidate.type === AST_NODE_TYPES.BlockStatement,
      );

      expect(result).toBeNull();
    });
  });

  describe('findEnclosingFunction', () => {
    it('should return the nearest enclosing function-like ancestor', () => {
      const functionNode = {
        type: AST_NODE_TYPES.FunctionExpression,
      } as unknown;
      const block = { type: AST_NODE_TYPES.BlockStatement, parent: functionNode } as unknown;
      const node = { type: AST_NODE_TYPES.Identifier, parent: block } as unknown;

      expect(findEnclosingFunction(node)).toBe(functionNode);
    });

    it('should return null when no enclosing function-like ancestor exists', () => {
      const node = {
        type: AST_NODE_TYPES.Identifier,
        parent: { type: AST_NODE_TYPES.Program },
      } as unknown;

      expect(findEnclosingFunction(node)).toBeNull();
    });
  });

  describe('getNextStatementInBlock', () => {
    it('should return the following statement in the same block', () => {
      const first = { type: AST_NODE_TYPES.ExpressionStatement } as unknown;
      const second = { type: AST_NODE_TYPES.ReturnStatement } as unknown;
      const block = {
        type: AST_NODE_TYPES.BlockStatement,
        body: [first, second],
      } as unknown;

      expect(getNextStatementInBlock(block, first)).toBe(second);
    });

    it('should return null when no following statement exists', () => {
      const only = { type: AST_NODE_TYPES.ExpressionStatement } as unknown;
      const block = {
        type: AST_NODE_TYPES.BlockStatement,
        body: [only],
      } as unknown;

      expect(getNextStatementInBlock(block, only)).toBeNull();
    });
  });

  describe('getParentBlockStatement', () => {
    it('should return the parent block statement for a statement node', () => {
      const block = { type: AST_NODE_TYPES.BlockStatement } as unknown;
      const statement = {
        type: AST_NODE_TYPES.ReturnStatement,
        parent: block,
      } as unknown;

      expect(getParentBlockStatement(statement)).toBe(block);
    });

    it('should return null when the parent is not a block statement', () => {
      const statement = {
        type: AST_NODE_TYPES.ReturnStatement,
        parent: { type: AST_NODE_TYPES.IfStatement },
      } as unknown;

      expect(getParentBlockStatement(statement)).toBeNull();
    });
  });

  describe('isInsideBoundary', () => {
    it('should return true when a match boundary is reached before a stop boundary', () => {
      const ancestors = [
        { type: AST_NODE_TYPES.Program },
        { type: AST_NODE_TYPES.ForStatement },
        { type: AST_NODE_TYPES.BlockStatement },
      ] as unknown;

      expect(
        isInsideBoundary(
          ancestors,
          new Set([AST_NODE_TYPES.ForStatement]),
          new Set([AST_NODE_TYPES.FunctionExpression]),
        ),
      ).toBe(true);
    });

    it('should return false when a stop boundary is reached before a match boundary', () => {
      const ancestors = [
        { type: AST_NODE_TYPES.Program },
        { type: AST_NODE_TYPES.ForStatement },
        { type: AST_NODE_TYPES.FunctionExpression },
        { type: AST_NODE_TYPES.BlockStatement },
      ] as unknown;

      expect(
        isInsideBoundary(
          ancestors,
          new Set([AST_NODE_TYPES.ForStatement]),
          new Set([AST_NODE_TYPES.FunctionExpression]),
        ),
      ).toBe(false);
    });
  });
});
