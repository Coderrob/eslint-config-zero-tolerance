import { ruleTester } from '../testing/test-helper';
import { requireTestDescriptionStyle } from './require-test-description-style';

ruleTester.run('require-test-description-style', requireTestDescriptionStyle, {
  valid: [
    {
      code: 'it("should test something", () => {});',
      name: 'should allow it with should prefix',
    },
    {
      code: 'test("should work correctly", () => {});',
      name: 'should allow test with should prefix',
    },
    {
      code: 'it("should handle edge cases", function() {});',
      name: 'should allow function expression with should prefix',
    },
    {
      code: 'it("should support async tests", async () => {});',
      name: 'should allow async arrow function with should prefix',
    },
    {
      code: 'test("should accept any callback", function testCallback() {});',
      name: 'should allow named function expression with should prefix',
    },
    {
      code: 'describe("MyComponent", () => { it("should render", () => {}); });',
      name: 'should allow nested test with should prefix',
    },
    {
      code: 'it.skip("should be skipped", () => {});',
      name: 'should allow skipped test with should prefix',
    },
    {
      code: 'test.only("should run only", () => {});',
      name: 'should allow focused test with should prefix',
    },
    {
      code: 'const notATest = it;',
      name: 'should allow it as variable reference and not a call',
    },
    {
      code: 'const obj = { test: "value" };',
      name: 'should allow test as object property',
    },
    {
      code: 'it.skip(123, () => {});',
      name: 'should allow skipped test with non-string description',
    },
    {
      code: 'it(`should template`, () => {});',
      name: 'should allow template literal description',
    },
    {
      code: 'test.only(100, () => {});',
      name: 'should allow numeric description',
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
      code: "test['only']('should run only', () => {});",
      name: 'should allow computed focused test with should prefix',
    },
    {
      code: 'it("renders correctly", () => {});',
      name: 'should allow custom prefix when configured',
      options: [{ prefix: 'renders' }],
    },
    {
      code: 'helper.it("should be ignored", () => {});',
      name: 'should allow member call on non-test object',
    },
    {
      code: 'it();',
      name: 'should allow test call without args',
    },
  ],
  invalid: [
    {
      code: 'it("tests something", () => {});',
      name: 'should report it without should prefix',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'it("should tests something", () => {});',
    },
    {
      code: 'test("does something", () => {});',
      name: 'should report test without should prefix',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'test("should does something", () => {});',
    },
    {
      code: 'it("Testing functionality", () => {});',
      name: 'should report capitalized but wrong format',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'it("should Testing functionality", () => {});',
    },
    {
      code: 'it("renders correctly", () => {});',
      name: 'should report descriptive text missing should',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'it("should renders correctly", () => {});',
    },
    {
      code: 'test("validates input", async () => {});',
      name: 'should report async test without should prefix',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'test("should validates input", async () => {});',
    },
    {
      code: 'it("Should be lowercase", () => {});',
      name: 'should report Should with capital S',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'it("should Should be lowercase", () => {});',
    },
    {
      code: 'test("   does something", () => {});',
      name: 'should report leading whitespace without should',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'test("should does something", () => {});',
    },
    {
      code: 'it.skip("skipped test", () => {});',
      name: 'should enforce skip tests when ignoreSkip is false',
      options: [{ ignoreSkip: false }],
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'it.skip("should skipped test", () => {});',
    },
    {
      code: "test['skip']('skipped test', () => {});",
      name: 'should enforce computed skip tests when ignoreSkip is false',
      options: [{ ignoreSkip: false }],
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: "test['skip'](\"should skipped test\", () => {});",
    },
    {
      code: "test['only']('runs focused test', () => {});",
      name: 'should report computed focused test descriptions without should prefix',
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: "test['only'](\"should runs focused test\", () => {});",
    },
    {
      code: 'it("handles correctly", () => {});',
      name: 'should autofix using configured custom prefix',
      options: [{ prefix: 'renders' }],
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'it("renders handles correctly", () => {});',
    },
    {
      code: 'it("testing behavior", () => {});',
      name: 'should not double-space when prefix already ends with a space',
      options: [{ prefix: 'when ' }],
      errors: [
        {
          messageId: 'requireTestDescriptionStyle',
        },
      ],
      output: 'it("when testing behavior", () => {});',
    },
  ],
});
