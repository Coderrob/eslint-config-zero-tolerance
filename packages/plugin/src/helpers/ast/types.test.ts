import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  getFirstTypeArgument,
  getTypeReferenceName,
  hasNamedTypeReferenceWithTypeArguments,
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
      } as unknown;

      expect(getTypeReferenceName(node)).toBe('Readonly');
    });

    it('should return null for a qualified type reference name', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.TSQualifiedName },
      } as unknown;

      expect(getTypeReferenceName(node)).toBeNull();
    });
  });

  describe('getFirstTypeArgument', () => {
    it('should return the first type argument when one is present', () => {
      const firstTypeArgument = { type: AST_NODE_TYPES.TSBooleanKeyword };
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeArguments: { params: [firstTypeArgument] },
      } as unknown;

      expect(getFirstTypeArgument(node)).toBe(firstTypeArgument);
    });

    it('should return null when a type reference has no type arguments', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
      } as unknown;

      expect(getFirstTypeArgument(node)).toBeNull();
    });
  });

  describe('hasAllReadonlyPropertyMembers', () => {
    it('should return true when every member is a readonly property signature', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeLiteral,
        members: [{ type: AST_NODE_TYPES.TSPropertySignature, readonly: true }],
      } as unknown;

      expect(hasAllReadonlyPropertyMembers(node)).toBe(true);
    });

    it('should return false when any member is mutable or not a property signature', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeLiteral,
        members: [{ type: AST_NODE_TYPES.TSMethodSignature, readonly: true }],
      } as unknown;

      expect(hasAllReadonlyPropertyMembers(node)).toBe(false);
    });
  });

  describe('hasTypeArguments', () => {
    it('should return true when a type reference has type arguments', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeArguments: { params: [{}] },
      } as unknown;

      expect(hasTypeArguments(node)).toBe(true);
    });

    it('should return false when a type reference has no type arguments', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
      } as unknown;

      expect(hasTypeArguments(node)).toBe(false);
    });
  });

  describe('isNamedTypeReference', () => {
    it('should return true when the type reference name matches', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Readonly' },
      } as unknown;

      expect(isNamedTypeReference(node, 'Readonly')).toBe(true);
    });

    it('should return false when the type reference name differs', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Props' },
      } as unknown;

      expect(isNamedTypeReference(node, 'Readonly')).toBe(false);
    });
  });

  describe('hasNamedTypeReferenceWithTypeArguments', () => {
    it('should return true when the type reference name matches and type arguments exist', () => {
      const node = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Readonly' },
        typeArguments: { params: [{ type: AST_NODE_TYPES.TSTypeLiteral, members: [] }] },
      } as unknown;

      expect(hasNamedTypeReferenceWithTypeArguments(node, 'Readonly')).toBe(true);
    });

    it('should return false when the name differs or type arguments are absent', () => {
      const mismatchedNode = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Props' },
        typeArguments: { params: [{ type: AST_NODE_TYPES.TSTypeLiteral, members: [] }] },
      } as unknown;
      const missingArgsNode = {
        type: AST_NODE_TYPES.TSTypeReference,
        typeName: { type: AST_NODE_TYPES.Identifier, name: 'Readonly' },
      } as unknown;

      expect(hasNamedTypeReferenceWithTypeArguments(mismatchedNode, 'Readonly')).toBe(false);
      expect(hasNamedTypeReferenceWithTypeArguments(missingArgsNode, 'Readonly')).toBe(false);
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
      } as unknown;

      expect(unwrapTsExpression(node)).toBe(inner);
    });

    it('should return the original expression when no wrapper is present', () => {
      const node = { type: AST_NODE_TYPES.Identifier, name: 'value' } as unknown;

      expect(unwrapTsExpression(node)).toBe(node);
    });
  });
});
