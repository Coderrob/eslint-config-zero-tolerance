import { TSESLint } from '@typescript-eslint/utils';
import { noBannedTypes } from './no-banned-types';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('no-banned-types', noBannedTypes, {
  valid: [
    {
      code: 'type MyType = string;',
    },
    {
      code: 'type MyFunction = (x: number) => number;',
    },
    {
      code: 'interface IUser { name: string; }',
    },
  ],
  invalid: [
    {
      code: 'type MyReturnType = ReturnType<typeof myFunction>;',
      errors: [
        {
          messageId: 'bannedReturnType',
        },
      ],
    },
    {
      code: 'type Value = MyObject["key"];',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type Prop = Props["onChange"];',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
  ],
});
