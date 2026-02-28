import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noThrowLiteral } from './no-throw-literal';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-throw-literal', noThrowLiteral, {
  valid: [
    {
      name: 'should allow throwing new Error',
      code: 'throw new Error("something went wrong");',
    },
    {
      name: 'should allow throwing new TypeError',
      code: 'throw new TypeError("invalid argument");',
    },
    {
      name: 'should allow throwing new RangeError',
      code: 'throw new RangeError("out of range");',
    },
    {
      name: 'should allow throwing a custom Error subclass',
      code: 'throw new CustomError("custom message");',
    },
    {
      name: 'should allow re-throwing a caught error identifier',
      code: 'try { fn(); } catch (err) { throw err; }',
    },
    {
      name: 'should allow throwing a member expression',
      code: 'throw this.error;',
    },
    {
      name: 'should allow throwing the result of a call expression',
      code: 'throw createError("message");',
    },
    {
      name: 'should allow throwing an awaited expression',
      code: 'async function f() { throw await getError(); }',
    },
  ],
  invalid: [
    {
      name: 'should error when throwing a string literal',
      code: 'throw "something went wrong";',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should error when throwing a numeric literal',
      code: 'throw 404;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should error when throwing a boolean literal',
      code: 'throw true;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should error when throwing null',
      code: 'throw null;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should error when throwing an object expression',
      code: 'throw { message: "error", code: 500 };',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'object expression' } }],
    },
    {
      name: 'should error when throwing a template literal',
      code: 'throw `something went wrong: ${reason}`;',
      errors: [
        {
          messageId: 'noThrowLiteral',
          data: { type: 'template literal' },
        },
      ],
    },
    {
      name: 'should error when throwing an array expression',
      code: 'throw ["error", 500];',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'array expression' } }],
    },
    {
      name: 'should error when throwing a conditional expression',
      code: 'throw condition ? "error-a" : "error-b";',
      errors: [
        {
          messageId: 'noThrowLiteral',
          data: { type: 'conditional expression' },
        },
      ],
    },
  ],
} as any);
