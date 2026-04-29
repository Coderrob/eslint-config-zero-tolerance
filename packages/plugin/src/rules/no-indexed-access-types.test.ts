import { ruleTester } from '../testing/test-helper';
import { noIndexedAccessTypes } from './no-indexed-access-types';

ruleTester.run('no-indexed-access-types', noIndexedAccessTypes, {
  valid: [
    {
      code: 'type MyType = string;',
      name: 'should allow simple string type',
    },
    {
      code: 'type Union = string | number;',
      name: 'should allow union type without indexed access',
    },
    {
      code: 'type Generic<T> = T[];',
      name: 'should allow generic array types',
    },
    {
      code: 'type ObjectType = { [key: string]: string };',
      name: 'should allow object types with index signatures',
    },
  ],
  invalid: [
    {
      code: 'type Value = MyObject["key"];',
      name: 'should report indexed access with string literal',
      errors: [{ messageId: 'noIndexedAccessTypes' }],
    },
    {
      code: 'type Value = MyObject["key"];',
      name: 'should suggest extracting indexed access with configured alias name pattern',
      options: [{ aliasNamePattern: '{object}{property}' }],
      errors: [
        {
          messageId: 'noIndexedAccessTypes',
          suggestions: [
            {
              messageId: 'extractIndexedAccessType',
              output: 'type MyObjectKey = MyObject["key"];\ntype Value = MyObjectKey;',
            },
          ],
        },
      ],
    },
    {
      code: 'type MyObjectKey = string;\ntype Value = MyObject["key"];',
      name: 'should not suggest extracting indexed access when generated alias collides',
      options: [{ aliasNamePattern: '{object}{property}' }],
      errors: [{ messageId: 'noIndexedAccessTypes', suggestions: [] }],
    },
    {
      code: 'type Prop = Props["onChange"];',
      name: 'should report indexed access for prop type',
      errors: [{ messageId: 'noIndexedAccessTypes' }],
    },
    {
      code: 'type ChainedAccess = Obj["prop1"]["prop2"];',
      name: 'should report chained indexed access',
      errors: [{ messageId: 'noIndexedAccessTypes' }, { messageId: 'noIndexedAccessTypes' }],
    },
    {
      code: 'type ArrayElement = MyArray[number];',
      name: 'should report indexed access with number',
      errors: [{ messageId: 'noIndexedAccessTypes' }],
    },
    {
      code: 'type KeyType = MyObject[keyof MyObject];',
      name: 'should report indexed access with keyof',
      errors: [{ messageId: 'noIndexedAccessTypes' }],
    },
    {
      code: 'type Mapped = { [K in keyof T]: T[K] };',
      name: 'should report mapped type with indexed access',
      errors: [{ messageId: 'noIndexedAccessTypes' }],
    },
  ],
});
