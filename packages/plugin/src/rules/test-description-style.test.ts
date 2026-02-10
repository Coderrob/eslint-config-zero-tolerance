import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { testDescriptionStyle } from './test-description-style';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('test-description-style', testDescriptionStyle, {
  valid: [
    {
      code: 'it("should test something", () => {});',
      name: 'it with should prefix',
    },
    {
      code: 'test("should work correctly", () => {});',
      name: 'test with should prefix',
    },
    {
      code: 'it("should handle edge cases", function() {});',
      name: 'function expression with should prefix',
    },
    {
      code: 'it("should support async tests", async () => {});',
      name: 'async arrow function with should prefix',
    },
    {
      code: 'test("should accept any callback", function testCallback() {});',
      name: 'named function expression with should prefix',
    },
    {
      code: 'describe("MyComponent", () => { it("should render", () => {}); });',
      name: 'nested test with should prefix',
    },
    {
      code: 'it.skip("should be skipped", () => {});',
      name: 'skipped test with should prefix',
    },
    {
      code: 'test.only("should run only", () => {});',
      name: 'focused test with should prefix',
    },
    {
      code: 'const notATest = it;',
      name: 'it as variable reference, not a call',
    },
    {
      code: 'const obj = { test: "value" };',
      name: 'test as object property',
    },
  ],
  invalid: [
    {
      code: 'it("tests something", () => {});',
      name: 'it without should prefix',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'test("does something", () => {});',
      name: 'test without should prefix',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'it("Testing functionality", () => {});',
      name: 'capitalized but wrong format',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'it("renders correctly", () => {});',
      name: 'descriptive but missing should',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'test("validates input", async () => {});',
      name: 'async test without should prefix',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'it("Should be lowercase", () => {});',
      name: 'Should with capital S',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'test("   does something", () => {});',
      name: 'leading whitespace without should',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
  ],
} as any);
