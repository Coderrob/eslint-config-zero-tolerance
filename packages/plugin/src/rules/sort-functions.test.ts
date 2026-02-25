import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { sortFunctions } from './sort-functions';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('sort-functions', sortFunctions, {
  valid: [
    {
      name: 'single top-level function',
      code: 'function alpha() {}',
    },
    {
      name: 'two top-level functions in alphabetical order',
      code: 'function alpha() {}\nfunction beta() {}',
    },
    {
      name: 'multiple top-level functions in alphabetical order',
      code: 'function alpha() {}\nfunction beta() {}\nfunction gamma() {}',
    },
    {
      name: 'no functions',
      code: 'const x = 1;',
    },
    {
      name: 'nested functions are ignored',
      code: 'function alpha() { function zeta() {} }\nfunction beta() {}',
    },
  ],
  invalid: [
    {
      name: 'two top-level functions out of order',
      code: 'function beta() {}\nfunction alpha() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'third function out of order',
      code: 'function alpha() {}\nfunction gamma() {}\nfunction beta() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'beta', previous: 'gamma' } }],
    },
    {
      name: 'first function is not the smallest',
      code: 'function zeta() {}\nfunction alpha() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'zeta' } }],
    },
    {
      name: 'multiple functions out of order',
      code: 'function gamma() {}\nfunction alpha() {}\nfunction beta() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'gamma' } }],
    },
    {
      name: 'case-insensitive violation',
      code: 'function Beta() {}\nfunction alpha() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'Beta' } }],
    },
  ],
} as any);
