import { ruleTester } from '../testing/test-helper';
import { noNonNullAssertion } from './no-non-null-assertion';

ruleTester.run('no-non-null-assertion', noNonNullAssertion, {
  valid: [
    {
      name: 'should allow nullish coalescing',
      code: 'const x = value ?? defaultValue;',
    },
    {
      name: 'should allow optional chaining',
      code: 'const x = value?.prop;',
    },
    {
      name: 'should allow explicit null check',
      code: 'if (value !== null) { use(value); }',
    },
    {
      name: 'should allow type annotation without assertion',
      code: 'const x: string = getValue();',
    },
  ],
  invalid: [
    {
      name: 'should report simple non-null assertion',
      code: 'const x = value!;',
      errors: [{ messageId: 'noNonNullAssertion' }],
    },
    {
      name: 'should report chained non-null assertion',
      code: 'const x = obj.prop!.method();',
      errors: [
        {
          messageId: 'noNonNullAssertion',
          suggestions: [
            {
              messageId: 'useOptionalChaining',
              output: 'const x = obj.prop?.method();',
            },
          ],
        },
      ],
    },
    {
      name: 'should report parameter non-null assertion',
      code: 'function f(x: string | null) { return x!.length; }',
      errors: [
        {
          messageId: 'noNonNullAssertion',
          suggestions: [
            {
              messageId: 'useOptionalChaining',
              output: 'function f(x: string | null) { return x?.length; }',
            },
          ],
        },
      ],
    },
    {
      name: 'should report DOM query non-null assertion',
      code: "const el = document.getElementById('id')!;",
      errors: [{ messageId: 'noNonNullAssertion' }],
    },
    {
      name: 'should suggest optional call for non-null asserted function',
      code: 'const value = callback!();',
      errors: [
        {
          messageId: 'noNonNullAssertion',
          suggestions: [
            {
              messageId: 'useOptionalChaining',
              output: 'const value = callback?.();',
            },
          ],
        },
      ],
    },
    {
      name: 'should suggest optional computed access for non-null asserted object',
      code: 'const value = data![key];',
      errors: [
        {
          messageId: 'noNonNullAssertion',
          suggestions: [
            {
              messageId: 'useOptionalChaining',
              output: 'const value = data?.[key];',
            },
          ],
        },
      ],
    },
    {
      name: 'should not suggest optional chaining for assignment targets',
      code: 'value!.prop = next;',
      errors: [{ messageId: 'noNonNullAssertion', suggestions: [] }],
    },
    {
      name: 'should report chained non-null assertion on find result',
      code: 'arr.find(x => x.id === 1)!.name',
      errors: [
        {
          messageId: 'noNonNullAssertion',
          suggestions: [
            {
              messageId: 'useOptionalChaining',
              output: 'arr.find(x => x.id === 1)?.name',
            },
          ],
        },
      ],
    },
  ],
});
