import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { sortFunctions } from './sort-functions';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('sort-functions', sortFunctions, {
  valid: [
    {
      name: 'should allow a single top-level function',
      code: 'function alpha() {}',
    },
    {
      name: 'should allow two top-level functions in alphabetical order',
      code: 'function alpha() {}\nfunction beta() {}',
    },
    {
      name: 'should allow multiple top-level functions in alphabetical order',
      code: 'function alpha() {}\nfunction beta() {}\nfunction gamma() {}',
    },
    {
      name: 'should allow top-level const arrow functions in alphabetical order',
      code: 'const alpha = () => {};\nconst beta = () => {};',
    },
    {
      name: 'should allow top-level const function expressions in alphabetical order',
      code: 'const alpha = function () {};\nconst beta = function () {};',
    },
    {
      name: 'should allow mixed function declarations and const arrows in alphabetical order',
      code: 'function alpha() {}\nconst beta = () => {};\nfunction gamma() {}',
    },
    {
      name: 'should allow exported const arrow functions in alphabetical order',
      code: 'export const alpha = () => {};\nexport const beta = () => {};',
    },
    {
      name: 'should allow exported function declarations in alphabetical order',
      code: 'export function alpha() {}\nexport function beta() {}',
    },
    {
      name: 'should allow files without functions',
      code: 'const x = 1;',
    },
    {
      name: 'should ignore nested functions',
      code: 'function alpha() { function zeta() {} }\nfunction beta() {}',
    },
    {
      name: 'should ignore nested const arrow functions',
      code: 'function alpha() { const zeta = () => {}; }\nconst beta = () => {};',
    },
    {
      name: 'should ignore anonymous default exported functions',
      code: 'export default function () {}',
    },
    {
      name: 'should ignore destructured top-level variable declarations',
      code: 'const { alpha } = obj;\nconst beta = () => {};',
    },
    {
      name: 'should ignore top-level let arrow functions',
      code: 'let beta = () => {};\nlet alpha = () => {};',
    },
    {
      name: 'should ignore top-level var arrow functions',
      code: 'var beta = () => {};\nvar alpha = () => {};',
    },
  ],
  invalid: [
    {
      name: 'should flag two top-level functions out of order',
      code: 'function beta() {}\nfunction alpha() {}',
      output: 'function alpha() {}\nfunction beta() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should flag when the third function is out of order',
      code: 'function alpha() {}\nfunction gamma() {}\nfunction beta() {}',
      output: 'function alpha() {}\nfunction beta() {}\nfunction gamma() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'beta', previous: 'gamma' } }],
    },
    {
      name: 'should flag when the first function is not alphabetically smallest',
      code: 'function zeta() {}\nfunction alpha() {}',
      output: 'function alpha() {}\nfunction zeta() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'zeta' } }],
    },
    {
      name: 'should flag multiple functions out of order',
      code: 'function gamma() {}\nfunction alpha() {}\nfunction beta() {}',
      output: [
        'function alpha() {}\nfunction gamma() {}\nfunction beta() {}',
        'function alpha() {}\nfunction beta() {}\nfunction gamma() {}',
      ],
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'gamma' } }],
    },
    {
      name: 'should compare names case-insensitively',
      code: 'function Beta() {}\nfunction alpha() {}',
      output: 'function alpha() {}\nfunction Beta() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'Beta' } }],
    },
    {
      name: 'should flag top-level const arrow functions out of order',
      code: 'const beta = () => {};\nconst alpha = () => {};',
      output: 'const alpha = () => {};\nconst beta = () => {};',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should flag mixed function declarations and arrows out of order',
      code: 'const beta = () => {};\nfunction alpha() {}',
      output: 'function alpha() {}\nconst beta = () => {};',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should flag exported const arrow functions out of order',
      code: 'export const beta = () => {};\nexport const alpha = () => {};',
      output: 'export const alpha = () => {};\nexport const beta = () => {};',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should flag exported function declarations out of order',
      code: 'export function beta() {}\nexport function alpha() {}',
      output: 'export function alpha() {}\nexport function beta() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should flag top-level const function expressions out of order',
      code: 'const beta = function () {};\nconst alpha = function () {};',
      output: 'const alpha = function () {};\nconst beta = function () {};',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions in multi-declarator const without fix',
      code: 'const beta = () => {}, alpha = () => {};',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
  ],
});
