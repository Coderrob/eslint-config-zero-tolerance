import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { requireTestDescriptionStyle } from './require-test-description-style';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('require-test-description-style', requireTestDescriptionStyle, {
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
    {
      code: 'it.skip(123, () => {});',
      name: 'skipped test with non-string description is ignored',
    },
    {
      code: 'it(`should template`, () => {});',
      name: 'template literal description is ignored',
    },
    {
      code: 'test.only(100, () => {});',
      name: 'numeric description is ignored',
    },
    {
      code: "it['skip']('should not enforce', () => {});",
      name: 'should allow computed skip with valid description',
    },
    {
      code: "it['skip']('tests something skipped', () => {});",
      name: 'should allow computed skip with description not starting with should',
    },
    {
      code: "test['skip']('skipped test', () => {});",
      name: 'should allow test computed skip with description not starting with should',
    },
    {
      code: 'helper.it("should be ignored", () => {});',
      name: 'member call on non-test object is ignored',
    },
    {
      code: 'it();',
      name: 'test call without args is ignored',
    },
  ],
  invalid: [
    {
      code: 'it("tests something", () => {});',
      name: 'it without should prefix',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
    },
    {
      code: 'test("does something", () => {});',
      name: 'test without should prefix',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
    },
    {
      code: 'it("Testing functionality", () => {});',
      name: 'capitalized but wrong format',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
    },
    {
      code: 'it("renders correctly", () => {});',
      name: 'descriptive but missing should',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
    },
    {
      code: 'test("validates input", async () => {});',
      name: 'async test without should prefix',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
    },
    {
      code: 'it("Should be lowercase", () => {});',
      name: 'Should with capital S',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
    },
    {
      code: 'test("   does something", () => {});',
      name: 'leading whitespace without should',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
    },
  ],
} as any);
