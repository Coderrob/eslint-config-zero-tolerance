import { parse } from '@typescript-eslint/parser';
import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  getCallArgument,
  getCalleeNamePath,
  getMatchingCallMemberMethodName,
  getStringLiteralCallArgument,
  hasCallCalleeNamePath,
} from './calls';

function parseCallExpression(code: string): TSESTree.CallExpression {
  const expression = parseExpression(code);
  if (expression.type !== AST_NODE_TYPES.CallExpression) {
    throw new Error(`Expected a call expression for: ${code}`);
  }
  return expression;
}

function parseExpression(code: string): TSESTree.Expression {
  const program = parse(code);
  const statement = program.body[0];
  if (statement?.type !== AST_NODE_TYPES.ExpressionStatement) {
    throw new Error(`Expected an expression statement for: ${code}`);
  }
  return statement.expression;
}

describe('ast call helpers', () => {
  describe('getCalleeNamePath', () => {
    it('should return a single name for an identifier callee', () => {
      const callee = parseCallExpression('describe()').callee;

      expect(getCalleeNamePath(callee)).toEqual(['describe']);
    });

    it('should return a full path for chained member callees', () => {
      const callee = parseCallExpression('describe.only.each()').callee;

      expect(getCalleeNamePath(callee)).toEqual(['describe', 'only', 'each']);
    });

    it('should return a computed string-member segment in the resolved path', () => {
      const callee = parseCallExpression("test['skip']()").callee;

      expect(getCalleeNamePath(callee)).toEqual(['test', 'skip']);
    });

    it('should unwrap nested call-expression callees', () => {
      const callee = parseCallExpression('test.each()()').callee;

      expect(getCalleeNamePath(callee)).toEqual(['test', 'each']);
    });

    it('should return null when a member path cannot be resolved statically', () => {
      const callee = parseCallExpression('test[dynamicName]()').callee;

      expect(getCalleeNamePath(callee)).toBeNull();
    });

    it('should return null for non identifier/member/call callee nodes', () => {
      const expression = parseExpression('this');

      expect(getCalleeNamePath(expression)).toBeNull();
    });
  });

  describe('getCallArgument', () => {
    it('should return the argument at the requested index', () => {
      const node = parseCallExpression("fn('first')");

      expect(getCallArgument(node, 0)).toBe(node.arguments[0]);
    });

    it('should return null when the requested argument is absent', () => {
      expect(getCallArgument(parseCallExpression('fn()'), 0)).toBeNull();
    });
  });

  describe('getStringLiteralCallArgument', () => {
    it('should return the string-literal argument node at the requested index', () => {
      const node = parseCallExpression("fn('should work')");

      expect(getStringLiteralCallArgument(node, 0)).toBe(node.arguments[0]);
    });

    it('should return null when the argument is not a string literal', () => {
      expect(getStringLiteralCallArgument(parseCallExpression('fn(1)'), 0)).toBeNull();
    });

    it('should return null when the requested argument is absent', () => {
      expect(getStringLiteralCallArgument(parseCallExpression('fn()'), 0)).toBeNull();
    });
  });

  describe('hasCallCalleeNamePath', () => {
    it('should return true when the call expression callee matches the expected path', () => {
      const node = parseCallExpression("test['skip']()");

      expect(hasCallCalleeNamePath(node, ['test', 'skip'])).toBe(true);
    });

    it('should return false when the resolved callee path does not match', () => {
      const node = parseCallExpression('describe()');

      expect(hasCallCalleeNamePath(node, ['test'])).toBe(false);
    });
  });

  describe('getMatchingCallMemberMethodName', () => {
    it('should return the member method name when it is in the allowed set', () => {
      const node = parseCallExpression('items.push()');

      expect(getMatchingCallMemberMethodName(node, new Set(['push']))).toBe('push');
    });

    it('should return the computed string-member name when it is in the allowed set', () => {
      const node = parseCallExpression("items['splice']()");

      expect(getMatchingCallMemberMethodName(node, new Set(['splice']))).toBe('splice');
    });

    it('should return null when the member method name is not in the allowed set', () => {
      const node = parseCallExpression('items.map()');

      expect(getMatchingCallMemberMethodName(node, new Set(['push']))).toBeNull();
    });

    it('should return null when the call does not target a member expression', () => {
      const node = parseCallExpression('push()');

      expect(getMatchingCallMemberMethodName(node, new Set(['push']))).toBeNull();
    });
  });
});
