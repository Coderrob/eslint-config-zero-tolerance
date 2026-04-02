import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  getFirstNonThisParameter,
  getObjectDestructuredParameterTypeNode,
  getParameterTypeAnnotation,
  getParameterTypeNode,
  isThisParameter,
} from './parameters';

describe('ast parameter helpers', () => {
  describe('getFirstNonThisParameter', () => {
    it('should return the first parameter when it is already a real argument', () => {
      const param = { type: AST_NODE_TYPES.Identifier, name: 'props' };

      expect(getFirstNonThisParameter([param] as any)).toBe(param);
    });

    it('should return the first parameter that is not the this pseudo-parameter', () => {
      const thisParam = { type: AST_NODE_TYPES.Identifier, name: 'this' };
      const actualParam = { type: AST_NODE_TYPES.Identifier, name: 'props' };

      expect(getFirstNonThisParameter([thisParam, actualParam] as any)).toBe(actualParam);
    });

    it('should return undefined when every parameter is the this pseudo-parameter', () => {
      const thisParam = { type: AST_NODE_TYPES.Identifier, name: 'this' };

      expect(getFirstNonThisParameter([thisParam] as any)).toBeUndefined();
    });
  });

  describe('getObjectDestructuredParameterTypeNode', () => {
    it('should return the type node for a directly annotated object pattern', () => {
      const typeNode = { type: AST_NODE_TYPES.TSTypeLiteral };
      const param = {
        type: AST_NODE_TYPES.ObjectPattern,
        typeAnnotation: { typeAnnotation: typeNode },
      } as any;

      expect(getObjectDestructuredParameterTypeNode(param)).toBe(typeNode);
    });

    it('should return the type node for an assignment-pattern object destructuring parameter', () => {
      const typeNode = { type: AST_NODE_TYPES.TSTypeReference };
      const param = {
        type: AST_NODE_TYPES.AssignmentPattern,
        left: {
          type: AST_NODE_TYPES.ObjectPattern,
          typeAnnotation: { typeAnnotation: typeNode },
        },
      } as any;

      expect(getObjectDestructuredParameterTypeNode(param)).toBe(typeNode);
    });

    it('should return null for non-object destructured parameters', () => {
      const param = { type: AST_NODE_TYPES.Identifier, name: 'value' } as any;

      expect(getObjectDestructuredParameterTypeNode(param)).toBeNull();
    });

    it('should return null for assignment-pattern parameters that do not destructure objects', () => {
      const param = {
        type: AST_NODE_TYPES.AssignmentPattern,
        left: { type: AST_NODE_TYPES.Identifier, name: 'value' },
      } as any;

      expect(getObjectDestructuredParameterTypeNode(param)).toBeNull();
    });
  });

  describe('getParameterTypeAnnotation', () => {
    it('should return the annotation for a directly typed parameter', () => {
      const typeAnnotation = { type: AST_NODE_TYPES.TSTypeAnnotation };
      const param = {
        type: AST_NODE_TYPES.Identifier,
        name: 'value',
        typeAnnotation,
      } as any;

      expect(getParameterTypeAnnotation(param)).toBe(typeAnnotation);
    });

    it('should return the annotation for an assignment-pattern parameter', () => {
      const typeAnnotation = { type: AST_NODE_TYPES.TSTypeAnnotation };
      const param = {
        type: AST_NODE_TYPES.AssignmentPattern,
        left: {
          type: AST_NODE_TYPES.Identifier,
          name: 'value',
          typeAnnotation,
        },
      } as any;

      expect(getParameterTypeAnnotation(param)).toBe(typeAnnotation);
    });

    it('should return the annotation for a directly typed object pattern parameter', () => {
      const typeAnnotation = { type: AST_NODE_TYPES.TSTypeAnnotation };
      const param = {
        type: AST_NODE_TYPES.ObjectPattern,
        typeAnnotation,
      } as any;

      expect(getParameterTypeAnnotation(param)).toBe(typeAnnotation);
    });

    it('should return the annotation for a ts parameter property', () => {
      const typeAnnotation = { type: AST_NODE_TYPES.TSTypeAnnotation };
      const param = {
        type: AST_NODE_TYPES.TSParameterProperty,
        parameter: {
          type: AST_NODE_TYPES.Identifier,
          name: 'value',
          typeAnnotation,
        },
      } as any;

      expect(getParameterTypeAnnotation(param)).toBe(typeAnnotation);
    });

    it('should return the annotation for a ts parameter property with an assignment-pattern parameter', () => {
      const typeAnnotation = { type: AST_NODE_TYPES.TSTypeAnnotation };
      const param = {
        type: AST_NODE_TYPES.TSParameterProperty,
        parameter: {
          type: AST_NODE_TYPES.AssignmentPattern,
          left: {
            type: AST_NODE_TYPES.Identifier,
            name: 'value',
            typeAnnotation,
          },
        },
      } as any;

      expect(getParameterTypeAnnotation(param)).toBe(typeAnnotation);
    });

    it('should return null when a parameter has no type annotation', () => {
      const param = { type: AST_NODE_TYPES.Identifier, name: 'value' } as any;

      expect(getParameterTypeAnnotation(param)).toBeNull();
    });
  });

  describe('getParameterTypeNode', () => {
    it('should return the type node from a parameter annotation', () => {
      const typeNode = { type: AST_NODE_TYPES.TSTypeReference };
      const param = {
        type: AST_NODE_TYPES.Identifier,
        name: 'value',
        typeAnnotation: { typeAnnotation: typeNode },
      } as any;

      expect(getParameterTypeNode(param)).toBe(typeNode);
    });

    it('should return null when a parameter type annotation is absent', () => {
      const param = { type: AST_NODE_TYPES.Identifier, name: 'value' } as any;

      expect(getParameterTypeNode(param)).toBeNull();
    });
  });

  describe('isThisParameter', () => {
    it('should return true for the this pseudo-parameter', () => {
      const param = { type: AST_NODE_TYPES.Identifier, name: 'this' } as any;

      expect(isThisParameter(param)).toBe(true);
    });

    it('should return false for non-this parameters', () => {
      const param = { type: AST_NODE_TYPES.Identifier, name: 'value' } as any;

      expect(isThisParameter(param)).toBe(false);
    });

    it('should return false for non-identifier parameter shapes', () => {
      const param = { type: AST_NODE_TYPES.ObjectPattern } as any;

      expect(isThisParameter(param)).toBe(false);
    });
  });
});
