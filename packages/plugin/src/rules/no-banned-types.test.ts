import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { noBannedTypes } from './no-banned-types';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-banned-types', noBannedTypes, {
  valid: [
    {
      code: 'type MyType = string;',
      name: 'should allow simple string type',
    },
    {
      code: 'type MyFunction = (x: number) => number;',
      name: 'should allow function type',
    },
    {
      code: 'interface IUser { name: string; }',
      name: 'should allow interface definition',
    },
    {
      code: 'type Union = string | number;',
      name: 'should allow union type',
    },
    {
      code: 'type Intersection = A & B;',
      name: 'should allow intersection type',
    },
    {
      code: 'type Generic<T> = T[];',
      name: 'should allow generic type',
    },
    {
      code: 'type Tuple = [string, number];',
      name: 'should allow tuple type',
    },
    {
      code: 'type ObjectType = { [key: string]: string };',
      name: 'should allow object with index signature',
    },
  ],
  invalid: [
    {
      code: 'type MyReturnType = ReturnType<typeof myFunction>;',
      name: 'should report ReturnType usage',
      errors: [
        {
          messageId: 'bannedReturnType',
        },
      ],
    },
    {
      code: 'type Value = MyObject["key"];',
      name: 'should report indexed access with string literal',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type Prop = Props["onChange"];',
      name: 'should report indexed access for prop type',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type NestedReturn = ReturnType<ReturnType<typeof factory>>;',
      name: 'should report nested ReturnType usage',
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
      name: 'should report chained indexed access',
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
      name: 'should report ReturnType in union',
      errors: [
        {
          messageId: 'bannedReturnType',
        },
      ],
    },
    {
      code: 'type ArrayElement = MyArray[number];',
      name: 'should report indexed access with number',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type KeyType = MyObject[keyof MyObject];',
      name: 'should report indexed access with keyof',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
    {
      code: 'type Mapped = { [K in keyof T]: T[K] };',
      name: 'should report mapped type with indexed access',
      errors: [
        {
          messageId: 'bannedIndexedAccess',
        },
      ],
    },
  ],
});
