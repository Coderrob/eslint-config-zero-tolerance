import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noNonNullAssertion } from './no-non-null-assertion';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-non-null-assertion', noNonNullAssertion, {
  valid: [
    {
      name: 'should pass for nullish coalescing',
      code: 'const x = value ?? defaultValue;',
    },
    {
      name: 'should pass for optional chaining',
      code: 'const x = value?.prop;',
    },
    {
      name: 'should pass for explicit null check',
      code: 'if (value !== null) { use(value); }',
    },
    {
      name: 'should pass for type annotation without assertion',
      code: 'const x: string = getValue();',
    },
  ],
  invalid: [
    {
      name: 'should error for simple non-null assertion',
      code: 'const x = value!;',
      errors: [{ messageId: 'noNonNullAssertion' }],
    },
    {
      name: 'should error for chained non-null assertion',
      code: 'const x = obj.prop!.method();',
      errors: [{ messageId: 'noNonNullAssertion' }],
    },
    {
      name: 'should error for parameter non-null assertion',
      code: 'function f(x: string | null) { return x!.length; }',
      errors: [{ messageId: 'noNonNullAssertion' }],
    },
    {
      name: 'should error for DOM query non-null assertion',
      code: "const el = document.getElementById('id')!;",
      errors: [{ messageId: 'noNonNullAssertion' }],
    },
    {
      name: 'should error for chained non-null assertion on find result',
      code: 'arr.find(x => x.id === 1)!.name',
      errors: [{ messageId: 'noNonNullAssertion' }],
    },
  ],
} as any);
