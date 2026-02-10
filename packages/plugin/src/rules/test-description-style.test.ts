import { TSESLint } from '@typescript-eslint/utils';
import { testDescriptionStyle } from './test-description-style';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('test-description-style', testDescriptionStyle, {
  valid: [
    {
      code: 'it("should test something", () => {});',
    },
    {
      code: 'test("should work correctly", () => {});',
    },
    {
      code: 'it("should handle edge cases", function() {});',
    },
  ],
  invalid: [
    {
      code: 'it("tests something", () => {});',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'test("does something", () => {});',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
    {
      code: 'it("Testing functionality", () => {});',
      errors: [
        {
          messageId: 'testDescriptionStyle',
        },
      ],
    },
  ],
});
