import { ruleTester } from '../testing/test-helper';
import { sortFunctions } from './sort-functions';

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
    {
      name: 'should move attached leading comments with the sorted function',
      code: '/** Beta docs. */\nfunction beta() {}\n\n/** Alpha docs. */\nfunction alpha() {}',
      output: '/** Alpha docs. */\nfunction alpha() {}\n\n/** Beta docs. */\nfunction beta() {}',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should move jsdoc comments with exported const functions when sorted',
      code: [
        '/**',
        ' * Beta docs.',
        ' */',
        'export const beta = () => {};',
        '',
        '/**',
        ' * Alpha docs.',
        ' */',
        'export const alpha = () => {};',
      ].join('\n'),
      output: [
        '/**',
        ' * Alpha docs.',
        ' */',
        'export const alpha = () => {};',
        '',
        '/**',
        ' * Beta docs.',
        ' */',
        'export const beta = () => {};',
      ].join('\n'),
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should move same-line trailing comments with the sorted function',
      code: 'function beta() {} // beta details\nfunction alpha() {}',
      output: 'function alpha() {}\nfunction beta() {} // beta details',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should move adjacent same-line trailing block comments with the sorted function',
      code: 'function beta() {} /* beta one */ /* beta two */\nfunction alpha() {}',
      output: 'function alpha() {}\nfunction beta() {} /* beta one */ /* beta two */',
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions when trailing comments continue onto the next line',
      code: 'function beta() {} /* beta one */\n/* beta two */\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions when non-whitespace interrupts same-line trailing comments',
      code: 'function beta() {} /* beta one */ 0 /* beta two */\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions when code appears between same-line trailing comments',
      code: 'function beta() {} /* beta one */; /* beta two */\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions with interstitial comments without fix',
      code: 'function beta() {}\n\n// section break\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions with adjacent leading line comments without fix',
      code: 'function beta() {}\n// alpha details\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions when a leading block comment is adjacent to preceding code',
      code: 'function beta() {}\nconst separator = 1;\n/* alpha docs */\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions with directive comments without fix',
      code: '/* istanbul ignore next */\nfunction beta() {}\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
    {
      name: 'should report unsorted functions with trailing directive comments without fix',
      code: 'function beta() {} /* istanbul ignore next */\nfunction alpha() {}',
      output: null,
      errors: [{ messageId: 'unsortedFunction', data: { current: 'alpha', previous: 'beta' } }],
    },
  ],
});
