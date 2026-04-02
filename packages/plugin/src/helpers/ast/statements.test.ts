import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  getBooleanLiteralReturnValue,
  getBooleanLiteralValue,
  getReturnStatement,
  getSingleReturnStatement,
} from './statements';

describe('ast statement helpers', () => {
  describe('getBooleanLiteralReturnValue', () => {
    it('should return the boolean literal from a direct return statement', () => {
      const statement = {
        type: AST_NODE_TYPES.ReturnStatement,
        argument: { type: AST_NODE_TYPES.Literal, value: true },
      } as any;

      expect(getBooleanLiteralReturnValue(statement)).toBe(true);
    });

    it('should return null when the statement does not return a boolean literal', () => {
      const statement = {
        type: AST_NODE_TYPES.ReturnStatement,
        argument: { type: AST_NODE_TYPES.Identifier, name: 'result' },
      } as any;

      expect(getBooleanLiteralReturnValue(statement)).toBeNull();
    });
  });

  describe('getBooleanLiteralValue', () => {
    it('should return the boolean value from a boolean literal expression', () => {
      const value = { type: AST_NODE_TYPES.Literal, value: false } as any;

      expect(getBooleanLiteralValue(value)).toBe(false);
    });

    it('should return null for non-boolean literal expressions', () => {
      const value = { type: AST_NODE_TYPES.Literal, value: 'text' } as any;

      expect(getBooleanLiteralValue(value)).toBeNull();
    });
  });

  describe('getReturnStatement', () => {
    it('should return a direct return statement unchanged', () => {
      const statement = { type: AST_NODE_TYPES.ReturnStatement, argument: null } as any;

      expect(getReturnStatement(statement)).toBe(statement);
    });

    it('should return the single return statement from a one-statement block', () => {
      const returnStatement = { type: AST_NODE_TYPES.ReturnStatement, argument: null };
      const statement = {
        type: AST_NODE_TYPES.BlockStatement,
        body: [returnStatement],
      } as any;

      expect(getReturnStatement(statement)).toBe(returnStatement);
    });

    it('should return null when the statement cannot be reduced to a single return', () => {
      const statement = { type: AST_NODE_TYPES.ExpressionStatement } as any;

      expect(getReturnStatement(statement)).toBeNull();
    });

    it('should return null when the statement itself is null', () => {
      expect(getReturnStatement(null)).toBeNull();
    });
  });

  describe('getSingleReturnStatement', () => {
    it('should return the contained return statement when a block has exactly one return statement', () => {
      const returnStatement = { type: AST_NODE_TYPES.ReturnStatement, argument: null };
      const blockStatement = {
        type: AST_NODE_TYPES.BlockStatement,
        body: [returnStatement],
      } as any;

      expect(getSingleReturnStatement(blockStatement)).toBe(returnStatement);
    });

    it('should return null when a block contains zero or multiple statements', () => {
      const blockStatement = {
        type: AST_NODE_TYPES.BlockStatement,
        body: [{ type: AST_NODE_TYPES.ReturnStatement }, { type: AST_NODE_TYPES.ReturnStatement }],
      } as any;

      expect(getSingleReturnStatement(blockStatement)).toBeNull();
    });

    it('should return null when a block contains one non-return statement', () => {
      const blockStatement = {
        type: AST_NODE_TYPES.BlockStatement,
        body: [{ type: AST_NODE_TYPES.ExpressionStatement }],
      } as any;

      expect(getSingleReturnStatement(blockStatement)).toBeNull();
    });
  });
});
