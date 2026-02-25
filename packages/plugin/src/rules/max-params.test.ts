import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { maxParams } from './max-params';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('max-params', maxParams, {
  valid: [
    {
      name: 'should pass for 4 params with default limit',
      code: 'function f(a: number, b: number, c: number, d: number) {}',
    },
    {
      name: 'should pass for 0 params',
      code: 'function f() {}',
    },
    {
      name: 'should pass for 1-param arrow function',
      code: 'const fn = (a: number) => a;',
    },
    {
      name: 'should pass for 2 params with max 2',
      options: [{ max: 2 }],
      code: 'function f(a: number, b: number) {}',
    },
    {
      name: 'should pass for class method with 3 params and default limit',
      code: 'class C { m(a: number, b: number, c: number) {} }',
    },
  ],
  invalid: [
    {
      name: 'should error for 5 params with default limit',
      code: 'function f(a: number, b: number, c: number, d: number, e: number) {}',
      errors: [{ messageId: 'tooManyParams', data: { name: 'f', count: 5, max: 4 } }],
    },
    {
      name: 'should error for arrow function with 3 params and max 2',
      options: [{ max: 2 }],
      code: 'const fn = (a: number, b: number, c: number) => {};',
      errors: [{ messageId: 'tooManyParams' }],
    },
    {
      name: 'should error for 3 params with max 1',
      options: [{ max: 1 }],
      code: 'function f(a: number, b: number, c: number) {}',
      errors: [{ messageId: 'tooManyParams' }],
    },
    {
      name: 'should error for class method with 5 params and default limit',
      code: 'class C { method(a: number, b: number, c: number, d: number, e: number) {} }',
      errors: [{ messageId: 'tooManyParams' }],
    },
  ],
} as any);
