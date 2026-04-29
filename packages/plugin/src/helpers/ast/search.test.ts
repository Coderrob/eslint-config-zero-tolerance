import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { findDescendant, hasDescendant } from './search';

describe('ast search helpers', () => {
  const sourceCode = {
    visitorKeys: {
      ExpressionStatement: ['expression'],
      Identifier: [],
      Program: ['body'],
      TSTypeLiteral: [],
    },
  } as const;

  describe('findDescendant', () => {
    it('should return the first descendant that matches the predicate', () => {
      const identifier = { type: AST_NODE_TYPES.Identifier, name: 'value' };
      const root = {
        type: AST_NODE_TYPES.Program,
        body: [{ type: AST_NODE_TYPES.ExpressionStatement, expression: identifier }],
      } as any;

      const result = findDescendant(
        root,
        sourceCode,
        (candidate): candidate is typeof identifier => candidate.type === AST_NODE_TYPES.Identifier,
      );

      expect(result).toBe(identifier);
    });

    it('should stop descending into nodes that satisfy the stop predicate', () => {
      const identifier = { type: AST_NODE_TYPES.Identifier, name: 'hidden' };
      const root = {
        type: AST_NODE_TYPES.Program,
        body: [{ type: AST_NODE_TYPES.TSTypeLiteral, members: [identifier] }],
      } as any;

      const result = findDescendant(
        root,
        sourceCode,
        (candidate): candidate is typeof identifier => candidate.type === AST_NODE_TYPES.Identifier,
        (candidate) => candidate.type === AST_NODE_TYPES.TSTypeLiteral,
      );

      expect(result).toBeNull();
    });
  });

  describe('hasDescendant', () => {
    it('should return true when any descendant matches the predicate', () => {
      const identifier = { type: AST_NODE_TYPES.Identifier, name: 'value' };
      const root = {
        type: AST_NODE_TYPES.Program,
        body: [{ type: AST_NODE_TYPES.ExpressionStatement, expression: identifier }],
      } as any;

      expect(
        hasDescendant(
          root,
          sourceCode,
          (candidate): candidate is typeof identifier =>
            candidate.type === AST_NODE_TYPES.Identifier,
        ),
      ).toBe(true);
    });

    it('should return false when no descendant matches the predicate', () => {
      const root = {
        type: AST_NODE_TYPES.Program,
        body: [],
      } as any;

      expect(
        hasDescendant(
          root,
          sourceCode,
          (candidate): candidate is any => candidate.type === AST_NODE_TYPES.Identifier,
        ),
      ).toBe(false);
    });
  });
});
