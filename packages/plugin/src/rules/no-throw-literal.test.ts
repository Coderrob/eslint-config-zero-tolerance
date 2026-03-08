import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { noThrowLiteral } from './no-throw-literal';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

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
      name: 'should allow throwing a member expression when enabled by option',
      code: 'throw this.error;',
      options: [{ allowThrowingMemberExpressions: true }],
    },
    {
      name: 'should allow throwing the result of a call expression when enabled by option',
      code: 'throw createError("message");',
      options: [{ allowThrowingCallExpressions: true }],
    },
    {
      name: 'should allow throwing an awaited expression when enabled by option',
      code: 'async function f() { throw await getError(); }',
      options: [{ allowThrowingAwaitExpressions: true }],
    },
  ],
  invalid: [
    {
      name: 'should report throwing a string literal',
      code: 'throw "something went wrong";',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should report throwing a numeric literal',
      code: 'throw 404;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should report throwing a boolean literal',
      code: 'throw true;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should report throwing null',
      code: 'throw null;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'literal' } }],
    },
    {
      name: 'should report throwing an object expression',
      code: 'throw { message: "error", code: 500 };',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'object expression' } }],
    },
    {
      name: 'should report throwing a template literal',
      code: 'throw `something went wrong: ${reason}`;',
      errors: [
        {
          messageId: 'noThrowLiteral',
          data: { type: 'template literal' },
        },
      ],
    },
    {
      name: 'should report throwing an array expression',
      code: 'throw ["error", 500];',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'array expression' } }],
    },
    {
      name: 'should report throwing a conditional expression',
      code: 'throw condition ? "error-a" : "error-b";',
      errors: [
        {
          messageId: 'noThrowLiteral',
          data: { type: 'conditional expression' },
        },
      ],
    },
    {
      name: 'should report throwing a member expression by default',
      code: 'throw this.error;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'member expression' } }],
    },
    {
      name: 'should report throwing a call expression by default',
      code: 'throw createError("message");',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'call expression' } }],
    },
    {
      name: 'should report throwing an awaited expression by default',
      code: 'async function f() { throw await getError(); }',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'await expression' } }],
    },
    {
      name: 'should report throwing a non-catch identifier',
      code: 'const maybeString = "boom"; throw maybeString;',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'identifier' } }],
    },
    {
      name: 'should report throwing catch identifier inside nested function scope',
      code: 'try { fn(); } catch (err) { const rethrow = () => { throw err; }; rethrow(); }',
      errors: [{ messageId: 'noThrowLiteral', data: { type: 'identifier' } }],
    },
  ],
});
