import { ruleTester } from '../test-helper';
import { maxParams } from './max-params';

const DEFAULT_MAX_PARAMS = 4;
const MAX_ONE = 1;
const MAX_TWO = 2;
const PARAM_COUNT_FIVE = 5;

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
      options: [{ max: MAX_TWO }],
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
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: 'f', count: PARAM_COUNT_FIVE, max: DEFAULT_MAX_PARAMS },
        },
      ],
    },
    {
      name: 'should error for arrow function with 3 params and max 2',
      options: [{ max: MAX_TWO }],
      code: 'const fn = (a: number, b: number, c: number) => {};',
      errors: [{ messageId: 'tooManyParams' }],
    },
    {
      name: 'should error for 3 params with max 1',
      options: [{ max: MAX_ONE }],
      code: 'function f(a: number, b: number, c: number) {}',
      errors: [{ messageId: 'tooManyParams' }],
    },
    {
      name: 'should error for class method with 5 params and default limit',
      code: 'class C { method(a: number, b: number, c: number, d: number, e: number) {} }',
      errors: [{ messageId: 'tooManyParams' }],
    },
    {
      name: 'should error for anonymous function expression and report anonymous name',
      code: '(function(a: number, b: number, c: number, d: number, e: number) {})',
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: '<anonymous>', count: PARAM_COUNT_FIVE, max: DEFAULT_MAX_PARAMS },
        },
      ],
    },
    {
      name: 'should error for computed method key and report anonymous name fallback',
      code: 'class C { ["method"](a: number, b: number, c: number, d: number, e: number) {} }',
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: '<anonymous>', count: PARAM_COUNT_FIVE, max: DEFAULT_MAX_PARAMS },
        },
      ],
    },
    {
      name: 'should error for default anonymous function declaration',
      code: 'export default function(a: number, b: number, c: number, d: number, e: number) {}',
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: '<anonymous>', count: PARAM_COUNT_FIVE, max: DEFAULT_MAX_PARAMS },
        },
      ],
    },
  ],
});
