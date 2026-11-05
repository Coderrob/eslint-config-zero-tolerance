import { ruleTester } from '../testing/test-helper';
import { noMagicNumbers } from './no-magic-numbers';

describe('no-magic-numbers', () => {
  ruleTester.run('no-magic-numbers', noMagicNumbers, {
    valid: [
      {
        code: 'const SOMETHING = 10 * 100;',
        name: 'should allow multiplication in named constants',
      },
      {
        code: 'const SOMETHING = (24 * 60) * 60 * 1000;',
        name: 'should allow nested arithmetic in named constants',
      },
      {
        code: 'const SOMETHING = 10 + 100 - 20;',
        name: 'should allow addition and subtraction in named constants',
      },
      {
        code: 'const SOMETHING = 100 / 10 % 3;',
        name: 'should allow division and remainder in named constants',
      },
      {
        code: 'const SOMETHING = 2 ** 10;',
        name: 'should allow exponentiation in named constants',
      },
      {
        code: 'const SOMETHING = -(10 * +100);',
        name: 'should allow unary signs in named constants',
      },
      {
        code: 'const SOMETHING = BASE * 100;',
        name: 'should allow identifier operands in named constants',
      },
      {
        code: 'const x = 0;',
        name: 'should allow 0 as literal value',
      },
      {
        code: 'const x = 1;',
        name: 'should allow 1 as literal value',
      },
      {
        code: 'const x = -1;',
        name: 'should allow -1 as unary expression',
      },
      {
        code: 'const TIMEOUT_MS = 3000;',
        name: 'should allow direct const initialiser',
      },
      {
        code: 'const MAX_RETRY = 10;',
        name: 'should allow named const with any number',
      },
      {
        code: 'enum Status { Active = 1, Inactive = 2 }',
        name: 'should allow enum member values',
      },
      {
        code: 'for (let i = 0; i < items.length; i++) {}',
        name: 'should allow 0 in for loop initialiser',
      },
      {
        code: 'const arr = [0, 1];',
        name: 'should allow 0 and 1 in array literal',
      },
      {
        code: 'const OFFSET = -2;',
        name: 'should allow unary literal when assigned to const',
      },
      {
        code: 'const obj = { [0]: "zero", [1]: "one" };',
        name: 'should allow 0 and 1 in computed property keys',
      },
    ],
    invalid: [
      {
        code: 'let value = 10 * 100;',
        name: 'should report magic numbers in let declarations',
        errors: [
          { messageId: 'noMagicNumbers', data: { value: '10' } },
          { messageId: 'noMagicNumbers', data: { value: '100' } },
        ],
      },
      {
        code: 'var value = 10 * 100;',
        name: 'should report magic numbers in var declarations',
        errors: [
          { messageId: 'noMagicNumbers', data: { value: '10' } },
          { messageId: 'noMagicNumbers', data: { value: '100' } },
        ],
      },
      {
        code: 'const value = calculate(10 * 100);',
        name: 'should report magic numbers in call arguments',
        errors: [
          { messageId: 'noMagicNumbers', data: { value: '10' } },
          { messageId: 'noMagicNumbers', data: { value: '100' } },
        ],
      },
      {
        code: 'const value = [10 * 100];',
        name: 'should report magic numbers in arrays',
        errors: [
          { messageId: 'noMagicNumbers', data: { value: '10' } },
          { messageId: 'noMagicNumbers', data: { value: '100' } },
        ],
      },
      {
        code: 'const value = { timeout: 10 * 100 };',
        name: 'should report magic numbers in objects',
        errors: [
          { messageId: 'noMagicNumbers', data: { value: '10' } },
          { messageId: 'noMagicNumbers', data: { value: '100' } },
        ],
      },
      {
        code: 'const value = () => 10 * 100;',
        name: 'should report magic numbers in function bodies',
        errors: [
          { messageId: 'noMagicNumbers', data: { value: '10' } },
          { messageId: 'noMagicNumbers', data: { value: '100' } },
        ],
      },
      {
        code: 'const value = count > 100;',
        name: 'should report magic numbers in comparisons',
        errors: [{ messageId: 'noMagicNumbers', data: { value: '100' } }],
      },
      {
        code: 'const value = count && 100;',
        name: 'should report magic numbers in logical expressions',
        errors: [{ messageId: 'noMagicNumbers', data: { value: '100' } }],
      },
      {
        code: 'const value = enabled ? 10 : 100;',
        name: 'should report magic numbers in conditional branches',
        errors: [
          { messageId: 'noMagicNumbers', data: { value: '10' } },
          { messageId: 'noMagicNumbers', data: { value: '100' } },
        ],
      },
      {
        code: 'const { value = 100 } = options;',
        name: 'should report magic numbers in destructuring defaults',
        errors: [{ messageId: 'noMagicNumbers', data: { value: '100' } }],
      },
      {
        code: 'const value = items[100];',
        name: 'should report magic numbers in computed access',
        errors: [{ messageId: 'noMagicNumbers', data: { value: '100' } }],
      },
      {
        code: 'const value = ~100;',
        name: 'should report magic numbers in non-arithmetic unary expressions',
        errors: [{ messageId: 'noMagicNumbers', data: { value: '100' } }],
      },
      {
        code: 'setTimeout(fn, 3000)',
        name: 'should disallow magic number as function argument',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '3000' },
          },
        ],
      },
      {
        code: 'if (age > 18) {}',
        name: 'should disallow magic number in comparison',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '18' },
          },
        ],
      },
      {
        code: 'arr.slice(0, 10)',
        name: 'should disallow magic number in slice call',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '10' },
          },
        ],
      },
      {
        code: 'const x = [1, 2, 3]',
        name: 'should disallow magic numbers in array literal inside const',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '2' },
          },
          {
            messageId: 'noMagicNumbers',
            data: { value: '3' },
          },
        ],
      },
      {
        code: 'let x = 42;',
        name: 'should disallow magic number in let declaration',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '42' },
          },
        ],
      },
      {
        code: 'let x = -2;',
        name: 'should disallow unary magic number in let declaration',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '-2' },
          },
        ],
      },
      {
        code: 'const obj = { [42]: "value" };',
        name: 'should disallow magic number in computed property key',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '42' },
          },
        ],
      },
      {
        code: 'function foo() { return 99; }',
        name: 'should disallow magic number in return statement',
        errors: [
          {
            messageId: 'noMagicNumbers',
            data: { value: '99' },
          },
        ],
      },
    ],
  });
});
