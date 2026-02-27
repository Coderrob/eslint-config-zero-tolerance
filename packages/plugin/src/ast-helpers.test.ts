import {
  getIdentifierName,
  getFunctionDeclarationName,
  getFunctionVariableName,
  getFunctionMethodName,
  resolveFunctionName,
  getMemberPropertyName,
} from './ast-helpers';

describe('ast-helpers', () => {
  // ── getIdentifierName ────────────────────────────────────────────────────

  describe('getIdentifierName', () => {
    it('should return the name when node is an Identifier', () => {
      const node = { type: 'Identifier', name: 'foo' } as any;
      expect(getIdentifierName(node)).toBe('foo');
    });

    it('should return null when node is not an Identifier', () => {
      const node = { type: 'Literal', value: 42 } as any;
      expect(getIdentifierName(node)).toBeNull();
    });

    it('should return null when node is null', () => {
      expect(getIdentifierName(null)).toBeNull();
    });

    it('should return null when node is undefined', () => {
      expect(getIdentifierName(undefined)).toBeNull();
    });
  });

  // ── getFunctionDeclarationName ───────────────────────────────────────────

  describe('getFunctionDeclarationName', () => {
    it('should return the name from a named FunctionDeclaration', () => {
      const node = {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'myFunc' },
      } as any;
      expect(getFunctionDeclarationName(node)).toBe('myFunc');
    });

    it('should return null for a non-FunctionDeclaration node', () => {
      const node = { type: 'ArrowFunctionExpression' } as any;
      expect(getFunctionDeclarationName(node)).toBeNull();
    });
  });

  // ── getFunctionVariableName ──────────────────────────────────────────────

  describe('getFunctionVariableName', () => {
    it('should return the variable name when parent is a VariableDeclarator', () => {
      const node = {
        type: 'ArrowFunctionExpression',
        parent: {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'myVar' },
        },
      } as any;
      expect(getFunctionVariableName(node)).toBe('myVar');
    });

    it('should return null when parent is not a VariableDeclarator', () => {
      const node = {
        type: 'ArrowFunctionExpression',
        parent: { type: 'ExpressionStatement' },
      } as any;
      expect(getFunctionVariableName(node)).toBeNull();
    });
  });

  // ── getFunctionMethodName ────────────────────────────────────────────────

  describe('getFunctionMethodName', () => {
    it('should return the method name when parent is a MethodDefinition', () => {
      const node = {
        type: 'FunctionExpression',
        parent: {
          type: 'MethodDefinition',
          key: { type: 'Identifier', name: 'render' },
        },
      } as any;
      expect(getFunctionMethodName(node)).toBe('render');
    });

    it('should return null when parent is not a MethodDefinition', () => {
      const node = {
        type: 'FunctionExpression',
        parent: { type: 'Property' },
      } as any;
      expect(getFunctionMethodName(node)).toBeNull();
    });
  });

  // ── resolveFunctionName ──────────────────────────────────────────────────

  describe('resolveFunctionName', () => {
    it('should return the declaration name when available', () => {
      const node = {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'hello' },
        parent: { type: 'Program' },
      } as any;
      expect(resolveFunctionName(node)).toBe('hello');
    });

    it('should return anonymous when no name can be resolved', () => {
      const node = {
        type: 'ArrowFunctionExpression',
        parent: { type: 'CallExpression' },
      } as any;
      expect(resolveFunctionName(node)).toBe('<anonymous>');
    });
  });

  // ── getMemberPropertyName ────────────────────────────────────────────────

  describe('getMemberPropertyName', () => {
    it('should return property name for dot notation', () => {
      const node = {
        computed: false,
        property: { type: 'Identifier', name: 'foo' },
      };
      expect(getMemberPropertyName(node)).toBe('foo');
    });

    it('should return null for dot notation when property has no name', () => {
      const node = {
        computed: false,
        property: { type: 'Literal', value: 42 },
      };
      expect(getMemberPropertyName(node)).toBeNull();
    });

    it('should return property value for computed string literal', () => {
      const node = {
        computed: true,
        property: { type: 'Literal', value: 'bar' },
      };
      expect(getMemberPropertyName(node)).toBe('bar');
    });

    it('should return null for computed non-string literal', () => {
      const node = {
        computed: true,
        property: { type: 'Literal', value: 42 },
      };
      expect(getMemberPropertyName(node)).toBeNull();
    });
  });
});
