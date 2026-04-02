import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  getTypeReferenceName,
  hasAllReadonlyPropertyMembers,
  hasTypeArguments,
  isNamedTypeReference,
  unwrapTsExpression,
} from './types';

describe('ast type helpers', () => {
  describe('getTypeReferenceName', () => {
    it('should return the simple identifier name for an unqualified type reference', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Readonly' },
      } as any;

      expect(getTypeReferenceName(node)).toBe('Readonly');
    });

    it('should return null for a qualified type reference name', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.TSQualifiedName },
      } as any;

      expect(getTypeReferenceName(node)).toBeNull();
    });
  });

  describe('hasAllReadonlyPropertyMembers', () => {
    it('should return true when every member is a readonly property signature', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeLiteral,
        members: [{ type: AST_NODE_TYPES.TSPropertySignature, readonly: true }],
      } as any;

      expect(hasAllReadonlyPropertyMembers(node)).toBe(true);
    });

    it('should return false when any member is mutable or not a property signature', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeLiteral,
        members: [{ type: AST_NODE_TYPES.TSMethodSignature, readonly: true }],
      } as any;

      expect(hasAllReadonlyPropertyMembers(node)).toBe(false);
    });
  });

  describe('hasTypeArguments', () => {
    it('should return true when a type reference has type arguments', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeArguments: { params: [{}] },
      } as any;

      expect(hasTypeArguments(node)).toBe(true);
    });

    it('should return false when a type reference has no type arguments', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
      } as any;

      expect(hasTypeArguments(node)).toBe(false);
    });
  });

  describe('isNamedTypeReference', () => {
    it('should return true when the type reference name matches', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Readonly' },
      } as any;

      expect(isNamedTypeReference(node, 'Readonly')).toBe(true);
    });

    it('should return false when the type reference name differs', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Props' },
      } as any;

      expect(isNamedTypeReference(node, 'Readonly')).toBe(false);
    });
  });

  describe('unwrapTsExpression', () => {
    it('should recursively unwrap nested TypeScript wrapper expressions', () => {
      const inner = { type: AST_NODE_TYPES.Identifier, name: 'Component' };
      const node = {
        type: AST_NODE_TYPES.TSAsExpression,
        expression: {
          type: AST_NODE_TYPES.TSSatisfiesExpression,
          expression: {
            type: AST_NODE_TYPES.TSNonNullExpression,
            expression: inner,
          },
        },
      } as any;

      expect(unwrapTsExpression(node)).toBe(inner);
    });

    it('should return the original expression when no wrapper is present', () => {
      const node = { type: AST_NODE_TYPES.Identifier, name: 'value' } as any;

      expect(unwrapTsExpression(node)).toBe(node);
    });
  });
});
