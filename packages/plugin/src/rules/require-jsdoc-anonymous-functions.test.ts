import { ruleTester } from '../testing/test-helper';
import {
  RequireJsdocAnonymousFunctionsMessageId,
  requireJsdocAnonymousFunctions,
} from './require-jsdoc-anonymous-functions';

ruleTester.run('require-jsdoc-anonymous-functions', requireJsdocAnonymousFunctions, {
  valid: [
    {
      code: 'function doSomething() {}',
      name: 'should allow named function declaration without JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'const doThing = () => {};',
      name: 'should allow named arrow function without JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'class C {\n  /** Named computed method. */\n  ["x"]() {}\n}',
      name: 'should allow computed class method key with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: '/** Anonymous export. */\nexport default function () {}',
      name: 'should allow anonymous default export function with JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'const named = function namedInner() {}, other = 1;',
      name: 'should allow named multi-declarator function expression without JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'export const named = function namedInner() {};',
      name: 'should allow named exported function expression without JSDoc',
      filename: 'src/utils.ts',
    },
    {
      code: 'export default function () {}',
      name: 'should allow anonymous default export function without JSDoc in test files',
      filename: 'src/utils.test.ts',
    },
    {
      code: 'describe("CLI knowledge-base command", () => {\n  it("should knowledge-base command is registered", () => {\n    expect(true).toBe(true);\n  });\n});',
      name: 'should allow anonymous describe and it callbacks without JSDoc',
      filename: 'src/cli-knowledge-base.ts',
    },
    {
      code: 'test.skip.each([[1]])("should skip generated case", () => {\n  expect(true).toBe(true);\n});',
      name: 'should allow anonymous callbacks for chained test modifiers without JSDoc',
      filename: 'src/generated-cases.ts',
    },
    {
      code: 'test.describe("suite", () => {\n  test.beforeEach(() => {\n    expect(true).toBe(true);\n  });\n});',
      name: 'should allow anonymous playwright style describe and hook callbacks without JSDoc',
      filename: 'src/playwright-suite.ts',
    },
    {
      code: 'Deno.test("cli command", () => {\n  console.log("run");\n});',
      name: 'should allow anonymous namespaced test callbacks without JSDoc',
      filename: 'src/deno-command.ts',
    },
  ],
  invalid: [
    {
      code: 'export default function () {}',
      name: 'should report anonymous default export function without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
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
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
    {
      code: 'const items = [1, 2, 3];\nitems.map(function () { return 1; });',
      name: 'should report inline anonymous callback without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
    {
      code: 'const registered = register(function () { return 1; });',
      name: 'should report inline anonymous callback without standalone autofix',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
    {
      code: '(() => { return 1; })();',
      name: 'should report anonymous iife callbacks without JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
    {
      code: '// Not JSDoc\nexport default function () {}',
      name: 'should report anonymous default export with line comment but no JSDoc',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output:
        '// Not JSDoc\n/**\n * <anonymous> TODO: describe\n */\nexport default function () {}',
    },
    {
      code: 'const { name } = function () {}, other = 1;',
      name: 'should report anonymous multi-declarator destructured initializer without autofix',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
    {
      code: 'const hook = "describe";\nrunner[hook]("suite", () => {});',
      name: 'should report computed callback APIs that cannot be recognized as test hooks',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
    {
      code: 'class Derived extends Base {\n  constructor() {\n    super(() => {});\n  }\n}',
      name: 'should report anonymous callbacks passed to non-test super calls',
      filename: 'src/utils.ts',
      errors: [
        {
          messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
          data: { name: '<anonymous>' },
        },
      ],
      output: null,
    },
  ],
});
