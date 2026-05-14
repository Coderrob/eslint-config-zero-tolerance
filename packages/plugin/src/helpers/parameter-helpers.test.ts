import {
  getAssignmentPatternIdentifier,
  getNamedParameterIdentifier,
  getNamedParameterName,
  getRestElementIdentifier,
} from './parameter-helpers';

describe('parameter-helpers', () => {
  describe('getAssignmentPatternIdentifier', () => {
    it('should return the left identifier for a defaulted parameter', () => {
      const param = {
        type: 'AssignmentPattern',
        left: { type: 'Identifier', name: 'value' },
      } as unknown;

      expect(getAssignmentPatternIdentifier(param)).toEqual(param.left);
    });

    it('should return null for a destructured defaulted parameter', () => {
      const param = {
        type: 'AssignmentPattern',
        left: { type: 'ObjectPattern', properties: [] },
      } as unknown;

      expect(getAssignmentPatternIdentifier(param)).toBeNull();
    });
  });

  describe('getRestElementIdentifier', () => {
    it('should return the argument identifier for a rest parameter', () => {
      const param = {
        type: 'RestElement',
        argument: { type: 'Identifier', name: 'items' },
      } as unknown;

      expect(getRestElementIdentifier(param)).toEqual(param.argument);
    });

    it('should return null for a destructured rest parameter', () => {
      const param = {
        type: 'RestElement',
        argument: { type: 'ArrayPattern', elements: [] },
      } as unknown;

      expect(getRestElementIdentifier(param)).toBeNull();
    });
  });

  describe('getNamedParameterIdentifier', () => {
    it('should return the identifier for a plain parameter', () => {
      const param = { type: 'Identifier', name: 'flag' } as unknown;

      expect(getNamedParameterIdentifier(param)).toEqual(param);
    });

    it('should return the identifier for an assignment-pattern parameter', () => {
      const param = {
        type: 'AssignmentPattern',
        left: { type: 'Identifier', name: 'count' },
      } as unknown;

      expect(getNamedParameterIdentifier(param)).toEqual(param.left);
    });

    it('should return the identifier for a rest parameter', () => {
      const param = {
        type: 'RestElement',
        argument: { type: 'Identifier', name: 'values' },
      } as unknown;

      expect(getNamedParameterIdentifier(param)).toEqual(param.argument);
    });

    it('should return null for a destructured parameter', () => {
      const param = { type: 'ObjectPattern', properties: [] } as unknown;

      expect(getNamedParameterIdentifier(param)).toBeNull();
    });
  });

  describe('getNamedParameterName', () => {
    it('should return the resolved parameter name when an identifier is available', () => {
      const param = {
        type: 'AssignmentPattern',
        left: { type: 'Identifier', name: 'value' },
      } as unknown;

      expect(getNamedParameterName(param)).toBe('value');
    });

    it('should return null for a destructured parameter', () => {
      const param = { type: 'ArrayPattern', elements: [] } as unknown;

      expect(getNamedParameterName(param)).toBeNull();
    });
  });
});
