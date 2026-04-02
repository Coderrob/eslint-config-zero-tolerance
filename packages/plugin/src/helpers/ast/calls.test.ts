import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  getCallArgument,
  getCalleeNamePath,
  getStringLiteralCallArgument,
  hasCallCalleeNamePath,
} from './calls';

describe('ast call helpers', () => {
  describe('getCalleeNamePath', () => {
    it('should return a single name for an identifier callee', () => {
      const callee = { type: AST_NODE_TYPES.Identifier, name: 'describe' } as any;

      expect(getCalleeNamePath(callee)).toEqual(['describe']);
    });

    it('should return a full path for chained member callees', () => {
      const callee = {
        type: AST_NODE_TYPES.MemberExpression,
        computed: false,
        property: { type: AST_NODE_TYPES.Identifier, name: 'each' },
        object: {
          type: AST_NODE_TYPES.MemberExpression,
          computed: false,
          property: { type: AST_NODE_TYPES.Identifier, name: 'only' },
          object: { type: AST_NODE_TYPES.Identifier, name: 'describe' },
        },
      } as any;

      expect(getCalleeNamePath(callee)).toEqual(['describe', 'only', 'each']);
    });

    it('should return a computed string-member segment in the resolved path', () => {
      const callee = {
        type: AST_NODE_TYPES.MemberExpression,
        computed: true,
        property: { type: AST_NODE_TYPES.Literal, value: 'skip' },
        object: { type: AST_NODE_TYPES.Identifier, name: 'test' },
      } as any;

      expect(getCalleeNamePath(callee)).toEqual(['test', 'skip']);
    });

    it('should unwrap nested call-expression callees', () => {
      const callee = {
        type: AST_NODE_TYPES.CallExpression,
        callee: {
          type: AST_NODE_TYPES.MemberExpression,
          computed: false,
          property: { type: AST_NODE_TYPES.Identifier, name: 'each' },
          object: { type: AST_NODE_TYPES.Identifier, name: 'test' },
        },
      } as any;

      expect(getCalleeNamePath(callee)).toEqual(['test', 'each']);
    });

    it('should return null when a member path cannot be resolved statically', () => {
      const callee = {
        type: AST_NODE_TYPES.MemberExpression,
        computed: true,
        property: { type: AST_NODE_TYPES.Identifier, name: 'dynamicName' },
        object: { type: AST_NODE_TYPES.Identifier, name: 'test' },
      } as any;

      expect(getCalleeNamePath(callee)).toBeNull();
    });

    it('should return null for non identifier/member/call callee nodes', () => {
      const callee = { type: AST_NODE_TYPES.ThisExpression } as any;

      expect(getCalleeNamePath(callee)).toBeNull();
    });
  });

  describe('getCallArgument', () => {
    it('should return the argument at the requested index', () => {
      const firstArgument = { type: AST_NODE_TYPES.Literal, value: 'first' };
      const node = {
        type: AST_NODE_TYPES.CallExpression,
        arguments: [firstArgument],
      } as any;

      expect(getCallArgument(node, 0)).toBe(firstArgument);
    });

    it('should return null when the requested argument is absent', () => {
      const node = {
        type: AST_NODE_TYPES.CallExpression,
        arguments: [],
      } as any;

      expect(getCallArgument(node, 0)).toBeNull();
    });
  });

  describe('getStringLiteralCallArgument', () => {
    it('should return the string-literal argument node at the requested index', () => {
      const argument = { type: AST_NODE_TYPES.Literal, value: 'should work' };
      const node = {
        type: AST_NODE_TYPES.CallExpression,
        arguments: [argument],
      } as any;

      expect(getStringLiteralCallArgument(node, 0)).toBe(argument);
    });

    it('should return null when the argument is not a string literal', () => {
      const node = {
        type: AST_NODE_TYPES.CallExpression,
        arguments: [{ type: AST_NODE_TYPES.Literal, value: 1 }],
      } as any;

      expect(getStringLiteralCallArgument(node, 0)).toBeNull();
    });

    it('should return null when the requested argument is absent', () => {
      const node = {
        type: AST_NODE_TYPES.CallExpression,
        arguments: [],
      } as any;

      expect(getStringLiteralCallArgument(node, 0)).toBeNull();
    });
  });

  describe('hasCallCalleeNamePath', () => {
    it('should return true when the call expression callee matches the expected path', () => {
      const node = {
        type: AST_NODE_TYPES.CallExpression,
        callee: {
          type: AST_NODE_TYPES.MemberExpression,
          computed: true,
          property: { type: AST_NODE_TYPES.Literal, value: 'skip' },
          object: { type: AST_NODE_TYPES.Identifier, name: 'test' },
        },
      } as any;

      expect(hasCallCalleeNamePath(node, ['test', 'skip'])).toBe(true);
    });

    it('should return false when the resolved callee path does not match', () => {
      const node = {
        type: AST_NODE_TYPES.CallExpression,
        callee: { type: AST_NODE_TYPES.Identifier, name: 'describe' },
      } as any;

      expect(hasCallCalleeNamePath(node, ['test'])).toBe(false);
    });
  });
});
