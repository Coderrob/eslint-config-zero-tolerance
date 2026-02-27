import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { maxFunctionLines } from './max-function-lines';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('max-function-lines', maxFunctionLines, {
  valid: [
    {
      name: 'should pass for a 3-line named function with default limit',
      code: 'function small() {\n  const a = 1;\n}',
    },
    {
      name: 'should pass for a 1-line arrow function',
      code: 'const fn = () => { return 1; };',
    },
    {
      name: 'should pass for a function with exactly 30 lines with max 30',
      options: [{ max: 30 }],
      code: 'function f() {\n' + '  const _a = 1;\n'.repeat(28) + '}',
    },
    {
      name: 'should pass for a 5-line function expression assigned to const',
      code: 'const fn = function() {\n  const a = 1;\n  const b = 2;\n  const c = 3;\n};',
    },
    {
      name: 'should pass for an arrow function expression body without braces',
      code: 'const fn = (x: number) => x * 2;',
    },
  ],
  invalid: [
    {
      name: 'should error for a named function exceeding max with options',
      options: [{ max: 5 }],
      code:
        'function tooBig() {\n' +
        '  const _a = 1;\n' +
        '  const _b = 2;\n' +
        '  const _c = 3;\n' +
        '  const _d = 4;\n' +
        '  const _e = 5;\n' +
        '}',
      errors: [{ messageId: 'tooManyLines', data: { name: 'tooBig', lines: 7, max: 5 } }],
    },
    {
      name: 'should error for an anonymous arrow function exceeding max',
      options: [{ max: 3 }],
      code: 'const fn = () => {\n  const a = 1;\n  const b = 2;\n  const c = 3;\n};',
      errors: [{ messageId: 'tooManyLines' }],
    },
    {
      name: 'should error for a class method exceeding the limit',
      options: [{ max: 3 }],
      code: 'class C {\n  method() {\n    const a = 1;\n    const b = 2;\n    const c = 3;\n  }\n}',
      errors: [{ messageId: 'tooManyLines' }],
    },
    {
      name: 'should error for a function expression variable exceeding the limit',
      options: [{ max: 3 }],
      code: 'const fn = function() {\n  const a = 1;\n  const b = 2;\n  const c = 3;\n};',
      errors: [{ messageId: 'tooManyLines' }],
    },
    {
      name: 'should error for computed method key and use anonymous fallback name',
      options: [{ max: 3 }],
      code: 'class C {\n  ["method"]() {\n    const a = 1;\n    const b = 2;\n    const c = 3;\n  }\n}',
      errors: [{ messageId: 'tooManyLines', data: { name: '<anonymous>', lines: 5, max: 3 } }],
    },
    {
      name: 'should error for anonymous function expression and use anonymous fallback name',
      options: [{ max: 3 }],
      code: '(function() {\n  const a = 1;\n  const b = 2;\n  const c = 3;\n});',
      errors: [{ messageId: 'tooManyLines', data: { name: '<anonymous>', lines: 5, max: 3 } }],
    },
  ],
} as any);
