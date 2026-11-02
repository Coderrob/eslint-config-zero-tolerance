import * as tsParser from '@typescript-eslint/parser';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import {
  getCalleeName,
  getMemberPath,
  getStaticString,
  hasTrueObjectProperty,
  isDynamicString,
  isNullLiteral,
} from './security-ast';

function parseExpression(code: string): TSESTree.Expression {
  const statement = tsParser.parse(`(${code});`).body[0];
  if (statement.type !== AST_NODE_TYPES.ExpressionStatement) throw new Error('Expected expression');
  return statement.expression;
}

describe('security AST helpers', () => {
  it.each([
    ['run', 'run'],
    ['api.run', 'run'],
    ['api["run"]', 'run'],
    ['api[run]', null],
    ['api[0]', null],
    ['(() => {})', null],
  ])('should resolve only static callee names from %s', (code, expected) => {
    expect(getCalleeName(parseExpression(code))).toBe(expected);
  });

  it.each([
    ['api', 'api'],
    ['api.client.run', 'api.client.run'],
    ['api["run"]', 'api.run'],
    ['api[run]', null],
    ['api[0].run', null],
    ['factory().run', null],
  ])('should resolve only static member paths from %s', (code, expected) => {
    expect(getMemberPath(parseExpression(code))).toBe(expected);
  });

  it.each([
    ['"text"', 'text'],
    ['`text`', 'text'],
    ['`text${value}`', null],
    ['value', null],
    ['1', null],
    ['""', ''],
  ])('should extract static strings from %s', (code, expected) => {
    expect(getStaticString(parseExpression(code))).toBe(expected);
  });

  it.each([
    ['`text${value}`', true],
    ['`text`', false],
    ['"text" + value', true],
    ['value + ("text" + other)', true],
    ['value + `text`', true],
    ['value + other', false],
    ['value - "text"', false],
    ['value', false],
  ])('should detect dynamic string construction in %s', (code, expected) => {
    expect(isDynamicString(parseExpression(code))).toBe(expected);
  });

  it.each([
    ['{shell: true}', true],
    ['{"shell": true}', true],
    ['{["shell"]: true}', true],
    ['{[shell]: true}', false],
    ['{shell: false}', false],
    ['{shell: 1}', false],
    ['{shell: enabled}', false],
    ['{...options}', false],
    ['{}', false],
    ['options', false],
  ])('should recognize explicit true options in %s', (code, expected) => {
    expect(hasTrueObjectProperty(parseExpression(code), 'shell')).toBe(expected);
  });

  it('should handle absent options and literal null', () => {
    expect(hasTrueObjectProperty(undefined, 'shell')).toBe(false);
    expect(isNullLiteral(null)).toBe(false);
    expect(isNullLiteral(parseExpression('null'))).toBe(true);
    expect(isNullLiteral(parseExpression('undefined'))).toBe(false);
  });

  it('should preserve raw text for tagged template escapes without a cooked value', () => {
    const expression = parseExpression('String.raw`' + String.raw`\unicode` + '`');
    if (expression.type !== AST_NODE_TYPES.TaggedTemplateExpression)
      throw new Error('Expected tag');
    expect(getStaticString(expression.quasi)).toBe(String.raw`\unicode`);
  });
});
