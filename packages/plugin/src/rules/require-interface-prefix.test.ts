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
      output: 'interface IUser { name: string; }',
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
      output: null,
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
      output: 'interface IGeneric<T> { value: T; }',
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
      output: 'interface IExtended extends Base { extra: string; }',
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
      output: 'interface IProps { onClick(): void; }',
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
      output: null,
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
      output: null,
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
      output: null,
      errors: [
        {
          messageId: 'interfacePrefix',
          data: { name: 'I' },
        },
      ],
    },
    {
      code: 'interface User { name: string; }\ntype Account = User;\ninterface Profile extends User {}',
      name: 'should fix same-file type references when prefixing interface',
      output: [
        'interface IUser { name: string; }\ntype Account = IUser;\ninterface Profile extends IUser {}',
        'interface IUser { name: string; }\ntype Account = IUser;\ninterface IProfile extends IUser {}',
      ],
      errors: [
        { messageId: 'interfacePrefix', data: { name: 'User' } },
        { messageId: 'interfacePrefix', data: { name: 'Profile' } },
      ],
    },
    {
      code: 'interface IUser { id: string; }\ninterface User { name: string; }',
      name: 'should not fix interface prefix when replacement collides',
      output: null,
      errors: [{ messageId: 'interfacePrefix', data: { name: 'User' } }],
    },
  ],
});
