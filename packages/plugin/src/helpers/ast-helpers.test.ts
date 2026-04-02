import {
  getCallMemberMethodName,
  getFunctionDeclarationName,
  getFunctionMethodName,
  getFunctionVariableName,
  getIdentifierName,
  getLiteralStringValue,
  getMemberPropertyName,
  getMappedMemberPropertyName,
  getVisitorChildNodes,
  resolveFunctionName,
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

  describe('getCallMemberMethodName', () => {
    it('should return the method name when the callee is a member expression', () => {
      const node = {
        callee: {
          type: 'MemberExpression',
          computed: false,
          property: { type: 'Identifier', name: 'catch' },
        },
      } as any;

      expect(getCallMemberMethodName(node)).toBe('catch');
    });

    it('should return null when the callee is not a member expression', () => {
      const node = {
        callee: { type: 'Identifier', name: 'fn' },
      } as any;

      expect(getCallMemberMethodName(node)).toBeNull();
    });
  });

  describe('getLiteralStringValue', () => {
    it('should return the string value when node is a string Literal', () => {
      const node = { type: 'Literal', value: 'foo' } as any;
      expect(getLiteralStringValue(node)).toBe('foo');
    });

    it('should return null when node is a non-string Literal', () => {
      const node = { type: 'Literal', value: 42 } as any;
      expect(getLiteralStringValue(node)).toBeNull();
    });

    it('should return null when node is not a Literal', () => {
      const node = { type: 'Identifier', name: 'foo' } as any;
      expect(getLiteralStringValue(node)).toBeNull();
    });
  });

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

  describe('getMappedMemberPropertyName', () => {
    it('should return mapped replacement when member name is banned', () => {
      const node = {
        computed: false,
        property: { type: 'Identifier', name: 'mockImplementation' },
      };

      expect(
        getMappedMemberPropertyName(node, {
          mockImplementation: 'mockImplementationOnce',
        }),
      ).toEqual({ name: 'mockImplementation', replacement: 'mockImplementationOnce' });
    });

    it('should return null when member name is not in map', () => {
      const node = {
        computed: false,
        property: { type: 'Identifier', name: 'mockClear' },
      };

      expect(
        getMappedMemberPropertyName(node, {
          mockImplementation: 'mockImplementationOnce',
        }),
      ).toBeNull();
    });

    it('should return null when member property name cannot be resolved', () => {
      const node = {
        computed: true,
        property: { type: 'Literal', value: 1 },
      };

      expect(
        getMappedMemberPropertyName(node, {
          mockImplementation: 'mockImplementationOnce',
        }),
      ).toBeNull();
    });
  });

  describe('getVisitorChildNodes', () => {
    it('should return child nodes for configured visitor keys', () => {
      const sourceCode = {
        visitorKeys: {
          BinaryExpression: ['left', 'right', 'extras'],
        },
      } as any;
      const left = { type: 'Identifier', name: 'left' };
      const right = { type: 'Identifier', name: 'right' };
      const extra = { type: 'Literal', value: 1 };
      const node = {
        type: 'BinaryExpression',
        left,
        right,
        extras: [extra, 'not-a-node'],
      } as any;

      expect(getVisitorChildNodes(node, sourceCode)).toEqual([left, right, extra]);
    });

    it('should return an empty array when visitor keys are missing for the node type', () => {
      const sourceCode = {
        visitorKeys: {},
      } as any;
      const node = {
        type: 'UnknownExpression',
        child: { type: 'Identifier', name: 'value' },
      } as any;

      expect(getVisitorChildNodes(node, sourceCode)).toEqual([]);
    });
  });
});
