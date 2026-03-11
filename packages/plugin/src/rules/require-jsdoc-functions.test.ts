import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { RequireJsdocFunctionsMessageId, requireJsdocFunctions } from './require-jsdoc-functions';

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
      code: '/** Exported arrow function. */\nexport const doThing = () => {};',
      name: 'should allow exported arrow function with JSDoc above export declaration',
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
    {
      code: '/** Adds values.\n * @param a first value\n * @param b second value\n * @returns sum\n */\nfunction add(a: number, b: number) { return a + b; }',
      name: 'should allow function with params and return when JSDoc includes @param and @returns',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Parses input.\n * @param source input payload\n * @throws {Error} when payload is invalid\n */\nfunction parse(source: string) { if (source.length === 0) { throw new Error("invalid"); } }',
      name: 'should allow throwing function when JSDoc includes @throws',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Wrapper function. */\nfunction wrapper() { /** Nested function.\n * @returns one\n */ const nested = (): number => 1; return; }',
      name: 'should not require parent @returns or @throws tags based on nested function behavior',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Wrapper function. */\nfunction wrapper() { /** Nested function.\n   * @returns one\n   */ function nested(): number { return 1; } return; }',
      name: 'should not require parent @returns tag for nested function return statements',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Wrapper function. */\nfunction wrapper() { class Inner {\n    /** Gets a value.\n     * @returns value\n     */\n    getValue(): number { return 1; }\n  }\n  const text = "return value";\n  // return 123\n  return;\n}',
      name: 'should not require parent @returns tag for nested class returns or return-like text',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Wrapper function. */\nfunction wrapper() { const text = "throw error";\n  // throw new Error("boom")\n  /** Nested throws.\n   * @throws {Error} nested\n   */\n  function nested(): never { throw new Error("nested"); }\n  class Inner {\n    /** Inner throws.\n     * @throws {Error} inner\n     */\n    run(): never { throw new Error("inner"); }\n  }\n  return;\n}',
      name: 'should not require parent @throws tag for nested throws or throw-like text',
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
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'inner' },
        },
      ],
      output:
        '/** Outer function */\nfunction outer() {\n  /**\n   * inner TODO: describe\n   */\n  function inner() {}\n}',
    },
    {
      code: 'function doSomething() {}',
      name: 'should report function declaration without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doSomething' },
        },
      ],
      output: '/**\n * doSomething TODO: describe\n */\nfunction doSomething() {}',
    },
    {
      code: 'const doThing = () => {};',
      name: 'should report arrow function without JSDoc',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doThing' },
        },
      ],
      output: '/**\n * doThing TODO: describe\n */\nconst doThing = () => {};',
    },
    {
      code: 'export const doThing = () => {};',
      name: 'should report exported arrow function without JSDoc',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doThing' },
        },
      ],
      output: '/**\n * doThing TODO: describe\n */\nexport const doThing = () => {};',
    },
    {
      code: 'const doThing = function namedFn() {};',
      name: 'should report function expression without JSDoc',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doThing' },
        },
      ],
      output: '/**\n * doThing TODO: describe\n */\nconst doThing = function namedFn() {};',
    },
    {
      code: 'class MyClass {\n  doWork() {}\n}',
      name: 'should report class method without JSDoc',
      filename: 'src/my-class.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doWork' },
        },
      ],
      output: 'class MyClass {\n  /**\n   * doWork TODO: describe\n   */\n  doWork() {}\n}',
    },
    {
      code: 'class MyClass {\n  handler = () => {};\n}',
      name: 'should report class field arrow function without JSDoc',
      filename: 'src/my-class.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'handler' },
        },
      ],
      output:
        'class MyClass {\n  /**\n   * handler TODO: describe\n   */\n  handler = () => {};\n}',
    },
    {
      code: 'const obj = {\n  doWork() {},\n};',
      name: 'should report object literal shorthand method without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doWork' },
        },
      ],
      output: 'const obj = {\n  /**\n   * doWork TODO: describe\n   */\n  doWork() {},\n};',
    },
    {
      code: 'const obj = {\n  doWork: () => {},\n};',
      name: 'should report object literal arrow function property without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doWork' },
        },
      ],
      output: 'const obj = {\n  /**\n   * doWork TODO: describe\n   */\n  doWork: () => {},\n};',
    },
    {
      code: '/** Only one JSDoc */\nconst a = () => {}, b = () => {};',
      name: 'should report multi-declarator const with single JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'a' },
        },
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
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
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doSomething' },
        },
      ],
      output:
        '// Regular comment\n/**\n * doSomething TODO: describe\n */\nfunction doSomething() {}',
    },
    {
      code: '/* Not a JSDoc */\nfunction doSomething() {}',
      name: 'should report function with block comment but no JSDoc star',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'doSomething' },
        },
      ],
      output:
        '/* Not a JSDoc */\n/**\n * doSomething TODO: describe\n */\nfunction doSomething() {}',
    },
    {
      code: 'export default function () {}',
      name: 'should report anonymous default export function without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: '/**\n * <anonymous> TODO: describe\n */\nexport default function () {}',
    },
    {
      code: 'class C { ["x"]() {} }',
      name: 'should report computed class method key without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
    {
      code: 'function transform(source: string) { return source.trim(); }',
      name: 'should autofix missing JSDoc with generated @param and @returns tags',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
          data: { name: 'transform' },
        },
      ],
      output:
        '/**\n * transform TODO: describe\n * @param source TODO: describe parameter\n * @returns TODO: describe return value\n */\nfunction transform(source: string) { return source.trim(); }',
    },
    {
      code: '/** Adds values. */\nfunction add(a: number, b: number) { return a + b; }',
      name: 'should report missing @param tags when function has parameters',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocParam,
          data: { name: 'add' },
        },
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocReturns,
          data: { name: 'add' },
        },
      ],
      output:
        '/**\n * Adds values.\n * @param a TODO: describe parameter\n * @param b TODO: describe parameter\n * @returns TODO: describe return value\n */\nfunction add(a: number, b: number) { return a + b; }',
    },
    {
      code: '/** Computes a value.\n * @param value input value\n */\nconst compute = (value: number) => value * 2;',
      name: 'should report missing @returns tag when function returns a value',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocReturns,
          data: { name: 'compute' },
        },
      ],
      output:
        '/** Computes a value.\n * @param value input value\n * @returns TODO: describe return value\n */\nconst compute = (value: number) => value * 2;',
    },
    {
      code: '/** Parses input.\n * @param source input payload\n */\nfunction parse(source: string) { if (source.length === 0) { throw new Error("invalid"); } }',
      name: 'should report missing @throws tag when function throws',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocThrows,
          data: { name: 'parse' },
        },
      ],
      output:
        '/** Parses input.\n * @param source input payload\n * @throws {Error} TODO: describe error condition\n */\nfunction parse(source: string) { if (source.length === 0) { throw new Error("invalid"); } }',
    },
    {
      code: '/** Always fails. */\nfunction fail(reason: string) { throw new Error(reason); }',
      name: 'should autofix missing @param and @throws for direct throw statements',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocParam,
          data: { name: 'fail' },
        },
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocThrows,
          data: { name: 'fail' },
        },
      ],
      output:
        '/**\n * Always fails.\n * @param reason TODO: describe parameter\n * @throws {Error} TODO: describe error condition\n */\nfunction fail(reason: string) { throw new Error(reason); }',
    },
    {
      code: '/** Defaults value. */\nfunction defaults(value = 1) {}',
      name: 'should autofix @param for assignment pattern parameters',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocParam,
          data: { name: 'defaults' },
        },
      ],
      output:
        '/**\n * Defaults value.\n * @param value TODO: describe parameter\n */\nfunction defaults(value = 1) {}',
    },
    {
      code: '/** Handles rest args. */\nfunction collect(...rest: number[]) { return rest.length; }',
      name: 'should autofix @param and @returns for rest parameters',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocParam,
          data: { name: 'collect' },
        },
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocReturns,
          data: { name: 'collect' },
        },
      ],
      output:
        '/**\n * Handles rest args.\n * @param rest TODO: describe parameter\n * @returns TODO: describe return value\n */\nfunction collect(...rest: number[]) { return rest.length; }',
    },
    {
      code: '/** Handles object params. */\nfunction configure({ level }: { level: string }) {}',
      name: 'should autofix fallback @param names for destructured parameters',
      filename: 'src/helpers.ts',
      errors: [
        {
          messageId: RequireJsdocFunctionsMessageId.MissingJsdocParam,
          data: { name: 'configure' },
        },
      ],
      output:
        '/**\n * Handles object params.\n * @param param1 TODO: describe parameter\n */\nfunction configure({ level }: { level: string }) {}',
    },
  ],
});
