import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { requireJsdocFunctions } from './require-jsdoc-functions';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('require-jsdoc-functions', requireJsdocFunctions, {
  valid: [
    {
      code: '/** Does something. */\nfunction doSomething() {}',
      name: 'should allow function declaration with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Arrow function. */\nconst doThing = () => {};',
      name: 'should allow arrow function with JSDoc on variable declaration',
      filename: 'src/utils.ts',
    },
    {
      code: 'class MyClass {\n  /** Method JSDoc. */\n  doWork() {}\n}',
      name: 'should allow class method with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'class MyClass {\n  /** Field JSDoc. */\n  handler = () => {};\n}',
      name: 'should allow class field arrow function with JSDoc on PropertyDefinition',
      filename: 'src/utils.ts',
    },
    {
      code: 'const obj = {\n  /** Method JSDoc. */\n  doWork() {},\n};',
      name: 'should allow object literal shorthand method with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'const obj = {\n  /** Method JSDoc. */\n  doWork: () => {},\n};',
      name: 'should allow object literal arrow function property with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'function doSomething() {}',
      name: 'should allow function without JSDoc in test file',
      filename: 'src/utils.test.ts',
    },
    {
      code: 'const fn = () => {};',
      name: 'should allow arrow function without JSDoc in spec file',
      filename: 'src/utils.spec.ts',
    },
    {
      code: 'function doSomething() {}',
      name: 'should allow function without JSDoc in .test.js file',
      filename: 'utils.test.js',
    },
    {
      code: 'class C {\n  /** Named computed method. */\n  ["x"]() {}\n}',
      name: 'should allow computed class method with JSDoc',
      filename: 'src/utils.ts',
    },
  ],
  invalid: [
    {
      code: '/** Outer function */\nfunction outer() {\n  function inner() {}\n}',
      name: 'should report nested inner function without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'inner' },
        },
      ],
    },
    {
      code: 'function doSomething() {}',
      name: 'should report function declaration without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doSomething' },
        },
      ],
    },
    {
      code: 'const doThing = () => {};',
      name: 'should report arrow function without JSDoc',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doThing' },
        },
      ],
    },
    {
      code: 'const doThing = function namedFn() {};',
      name: 'should report function expression without JSDoc',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doThing' },
        },
      ],
    },
    {
      code: 'class MyClass {\n  doWork() {}\n}',
      name: 'should report class method without JSDoc',
      filename: 'src/my-class.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doWork' },
        },
      ],
    },
    {
      code: 'class MyClass {\n  handler = () => {};\n}',
      name: 'should report class field arrow function without JSDoc',
      filename: 'src/my-class.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'handler' },
        },
      ],
    },
    {
      code: 'const obj = {\n  doWork() {},\n};',
      name: 'should report object literal shorthand method without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doWork' },
        },
      ],
    },
    {
      code: 'const obj = {\n  doWork: () => {},\n};',
      name: 'should report object literal arrow function property without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doWork' },
        },
      ],
    },
    {
      code: '/** Only one JSDoc */\nconst a = () => {}, b = () => {};',
      name: 'should report multi-declarator const with single JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'a' },
        },
        {
          messageId: 'missingJsdoc',
          data: { name: 'b' },
        },
      ],
    },
    {
      code: '// Regular comment\nfunction doSomething() {}',
      name: 'should report function with line comment but no JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doSomething' },
        },
      ],
    },
    {
      code: '/* Not a JSDoc */\nfunction doSomething() {}',
      name: 'should report function with block comment but no JSDoc star',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doSomething' },
        },
      ],
    },
    {
      code: 'export default function () {}',
      name: 'should report anonymous default export function without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: '<anonymous>' },
        },
      ],
    },
    {
      code: 'class C { ["x"]() {} }',
      name: 'should report computed class method key without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: '<anonymous>' },
        },
      ],
    },
  ],
});
