import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';

/** Pre-configured RuleTester instance shared by all rule unit tests. */
export const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});
