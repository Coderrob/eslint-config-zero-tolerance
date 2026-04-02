import { ruleTester } from '../testing/test-helper';
import { requireInterfacePrefix } from './require-interface-prefix';

ruleTester.run('require-interface-prefix', requireInterfacePrefix, {
  valid: [
    {
      code: 'interface IUser { name: string; }',
      name: 'should allow basic interface with I prefix',
    },
    {
      code: 'interface IMyInterface { id: number; }',
      name: 'should allow interface with descriptive name',
    },
    {
      code: 'interface IAccount {}',
      name: 'should allow empty interface with I prefix',
    },
    {
      code: 'interface IGeneric<T> { value: T; }',
      name: 'should allow generic interface with I prefix',
    },
    {
      code: 'interface IExtended extends IBase { extra: string; }',
      name: 'should allow extended interface with I prefix',
    },
    {
      code: 'interface IMultipleParams<T, U> { first: T; second: U; }',
      name: 'should allow interface with multiple type parameters',
    },
    {
      code: 'interface IWithMethods { method(): void; }',
      name: 'should allow interface with method signatures',
    },
    {
      code: 'interface IIndexable { [key: string]: any; }',
      name: 'should allow indexable interface with I prefix',
    },
  ],
  invalid: [
    {
      code: 'interface User { name: string; }',
      name: 'should report interface without I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'User' },
        },
      ],
    },
    {
      code: 'interface user { name: string; }',
      name: 'should report lowercase interface name',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'user' },
        },
      ],
    },
    {
      code: 'interface Iuser { name: string; }',
      name: 'should report I prefix not followed by capital letter',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Iuser' },
        },
      ],
    },
    {
      code: 'interface Generic<T> { value: T; }',
      name: 'should report generic interface without I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Generic' },
        },
      ],
    },
    {
      code: 'interface Extended extends Base { extra: string; }',
      name: 'should report extended interface without I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Extended' },
        },
      ],
    },
    {
      code: 'interface Props { onClick(): void; }',
      name: 'should report interface with methods but no I prefix',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'Props' },
        },
      ],
    },
    {
      code: 'interface I_Thing { name: string; }',
      name: 'should report I prefix followed by underscore',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'I_Thing' },
        },
      ],
    },
    {
      code: 'interface I1Thing { name: string; }',
      name: 'should report I prefix followed by digit',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'I1Thing' },
        },
      ],
    },
    {
      code: 'interface I {}',
      name: 'should report interface name with prefix only',
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'I' },
        },
      ],
    },
  ],
});
