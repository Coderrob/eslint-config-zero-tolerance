import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { requireJsdocFunctions } from './require-jsdoc-functions';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('require-jsdoc-functions', requireJsdocFunctions, {
  valid: [
    {
      code: '/** Does something. */\nfunction doSomething() {}',
      name: 'function declaration with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Arrow function. */\nconst doThing = () => {};',
      name: 'arrow function with JSDoc on variable declaration',
      filename: 'src/utils.ts',
    },
    {
      code: 'class MyClass {\n  /** Method JSDoc. */\n  doWork() {}\n}',
      name: 'class method with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'class MyClass {\n  /** Field JSDoc. */\n  handler = () => {};\n}',
      name: 'class field arrow function with JSDoc on PropertyDefinition',
      filename: 'src/utils.ts',
    },
    {
      code: 'const obj = {\n  /** Method JSDoc. */\n  doWork() {},\n};',
      name: 'object literal shorthand method with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'const obj = {\n  /** Method JSDoc. */\n  doWork: () => {},\n};',
      name: 'object literal arrow function property with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'function doSomething() {}',
      name: 'function without JSDoc in test file is skipped',
      filename: 'src/utils.test.ts',
    },
    {
      code: 'const fn = () => {};',
      name: 'arrow function without JSDoc in spec file is skipped',
      filename: 'src/utils.spec.ts',
    },
    {
      code: 'function doSomething() {}',
      name: 'function without JSDoc in test file (.js) is skipped',
      filename: 'utils.test.js',
    },
  ],
  invalid: [
    {
      code: '/** Outer function */\nfunction outer() {\n  function inner() {}\n}',
      name: 'nested inner function without JSDoc',
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
      name: 'function declaration without JSDoc',
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
      name: 'arrow function without JSDoc',
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
      name: 'function expression without JSDoc',
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
      name: 'class method without JSDoc',
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
      name: 'class field arrow function without JSDoc',
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
      name: 'object literal shorthand method without JSDoc',
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
      name: 'object literal arrow function property without JSDoc',
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
      name: 'multi-declarator const with single JSDoc reports undocumented declarators',
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
      name: 'function with line comment but no JSDoc',
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
      name: 'function with block comment but no JSDoc star',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: 'missingJsdoc',
          data: { name: 'doSomething' },
        },
      ],
    },
  ],
} as any);
