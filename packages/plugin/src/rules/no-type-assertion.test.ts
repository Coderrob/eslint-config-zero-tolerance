import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noTypeAssertion } from './no-type-assertion';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-type-assertion', noTypeAssertion, {
  valid: [
    {
      name: 'no type assertion in non-test file',
      filename: 'src/utils.ts',
      code: 'const x: string = getValue();',
    },
    {
      name: 'as unknown in test file is allowed',
      filename: 'src/foo.test.ts',
      code: 'const x = getValue() as unknown;',
    },
    {
      name: 'as unknown in spec file is allowed',
      filename: 'src/foo.spec.ts',
      code: 'const y = getValue() as unknown;',
    },
    {
      name: 'no assertion with explicit type annotation in non-test file',
      filename: 'src/helper.ts',
      code: 'function foo(x: number): number { return x; }',
    },
    {
      name: 'as unknown in test tsx file is allowed',
      filename: 'src/bar.test.tsx',
      code: 'const z = getValue() as unknown;',
    },
  ],
  invalid: [
    {
      name: 'as string in non-test file',
      filename: 'src/utils.ts',
      code: 'const x = getValue() as string;',
      errors: [{ messageId: 'noTypeAssertion', data: { type: 'string' } }],
    },
    {
      name: 'as unknown in non-test file is not allowed',
      filename: 'src/utils.ts',
      code: 'const x = getValue() as unknown;',
      errors: [{ messageId: 'noTypeAssertion', data: { type: 'unknown' } }],
    },
    {
      name: 'as string in test file',
      filename: 'src/foo.test.ts',
      code: 'const x = getValue() as string;',
      errors: [{ messageId: 'noTypeAssertion', data: { type: 'string' } }],
    },
    {
      name: 'as MyType in non-test file',
      filename: 'src/utils.ts',
      code: 'const x = getValue() as MyType;',
      errors: [{ messageId: 'noTypeAssertion', data: { type: 'MyType' } }],
    },
    {
      name: 'as number in spec file',
      filename: 'src/bar.spec.ts',
      code: 'const x = getValue() as number;',
      errors: [{ messageId: 'noTypeAssertion', data: { type: 'number' } }],
    },
  ],
} as any);
