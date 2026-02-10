import { TSESLint } from '@typescript-eslint/utils';
import { interfacePrefix } from './interface-prefix';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('interface-prefix', interfacePrefix, {
  valid: [
    {
      code: 'interface IUser { name: string; }',
    },
    {
      code: 'interface IMyInterface { id: number; }',
    },
    {
      code: 'interface IAccount {}',
    },
  ],
  invalid: [
    {
      code: 'interface User { name: string; }',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'User' },
        },
      ],
    },
    {
      code: 'interface user { name: string; }',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'user' },
        },
      ],
    },
    {
      code: 'interface Iuser { name: string; }',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Iuser' },
        },
      ],
    },
  ],
});
