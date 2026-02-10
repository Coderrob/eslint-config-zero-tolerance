import { TSESLint } from '@typescript-eslint/utils';
import { noBannedTypes } from './no-banned-types';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('no-banned-types', noBannedTypes, {
  valid: [
    {
      code: 'type MyType = string;',
      name: 'simple string type',
    },
    {
      code: 'type MyFunction = (x: number) => number;',
      name: 'function type',
    },
    {
      code: 'interface IUser { name: string; }',
      name: 'interface definition',
    },
    {
      code: 'type Union = string | number;',
      name: 'union type',
    },
    {
      code: 'type Intersection = A & B;',
      name: 'intersection type',
    },
    {
      code: 'type Generic<T> = T[];',
      name: 'generic type',
    },
    {
      code: 'type Tuple = [string, number];',
      name: 'tuple type',
    },
    {
      code: 'type ObjectType = { [key: string]: string };',
      name: 'object with index signature',
    },
  ],
  invalid: [
    {
      code: 'type MyReturnType = ReturnType<typeof myFunction>;',
      name: 'ReturnType usage',
      errors: [
        {
          messageId: 'bannedReturnType',
        },
      ],
    },
    {
      code: 'type Value = MyObject["key"];',
      name: 'indexed access with string literal',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type Prop = Props["onChange"];',
      name: 'indexed access for prop type',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type NestedReturn = ReturnType<ReturnType<typeof factory>>;',
      name: 'nested ReturnType',
      errors: [
        {
          messageId: 'bannedReturnType',
        },
        {
          messageId: 'bannedReturnType',
        },
      ],
    },
    {
      code: 'type ChainedAccess = Obj["prop1"]["prop2"];',
      name: 'chained indexed access',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type Combined = ReturnType<typeof fn> | string;',
      name: 'ReturnType in union',
      errors: [
        {
          messageId: 'bannedReturnType',
        },
      ],
    },
    {
      code: 'type ArrayElement = MyArray[number];',
      name: 'indexed access with number',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type KeyType = MyObject[keyof MyObject];',
      name: 'indexed access with keyof',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type Mapped = { [K in keyof T]: T[K] };',
      name: 'mapped type with indexed access',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
  ],
});
