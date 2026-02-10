import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { interfacePrefix } from './interface-prefix';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('interface-prefix', interfacePrefix, {
  valid: [
    {
      code: 'interface IUser { name: string; }',
      name: 'basic interface with I prefix',
    },
    {
      code: 'interface IMyInterface { id: number; }',
      name: 'interface with descriptive name',
    },
    {
      code: 'interface IAccount {}',
      name: 'empty interface with I prefix',
    },
    {
      code: 'interface IGeneric<T> { value: T; }',
      name: 'generic interface with I prefix',
    },
    {
      code: 'interface IExtended extends IBase { extra: string; }',
      name: 'extended interface with I prefix',
    },
    {
      code: 'interface IMultipleParams<T, U> { first: T; second: U; }',
      name: 'interface with multiple type parameters',
    },
    {
      code: 'interface IWithMethods { method(): void; }',
      name: 'interface with method signatures',
    },
    {
      code: 'interface IIndexable { [key: string]: any; }',
      name: 'indexable interface with I prefix',
    },
  ],
  invalid: [
    {
      code: 'interface User { name: string; }',
      name: 'interface without I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'User' },
        },
      ],
    },
    {
      code: 'interface user { name: string; }',
      name: 'lowercase interface name',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'user' },
        },
      ],
    },
    {
      code: 'interface Iuser { name: string; }',
      name: 'I prefix but not followed by capital letter',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Iuser' },
        },
      ],
    },
    {
      code: 'interface Generic<T> { value: T; }',
      name: 'generic interface without I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Generic' },
        },
      ],
    },
    {
      code: 'interface Extended extends Base { extra: string; }',
      name: 'extended interface without I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Extended' },
        },
      ],
    },
    {
      code: 'interface Props { onClick(): void; }',
      name: 'interface with methods but no I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Props' },
        },
      ],
    },
  ],
} as any);
