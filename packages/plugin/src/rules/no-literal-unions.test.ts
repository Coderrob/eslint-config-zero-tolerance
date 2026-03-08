import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noLiteralUnions } from './no-literal-unions';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-literal-unions', noLiteralUnions, {
  valid: [
    {
      code: 'type Numbers = number | string;',
      name: 'should allow non-literal union types',
    },
    {
      code: 'type Mixed = boolean | null | undefined;',
      name: 'should allow boolean and null/undefined union',
    },
    {
      code: 'enum Status { Active = "active", Inactive = "inactive" }',
      name: 'should allow enum definition',
    },
    {
      code: 'type MyType = string;',
      name: 'should allow simple type alias',
    },
    {
      code: 'type UserType = User | Admin;',
      name: 'should allow union of custom types',
    },
    {
      code: 'type Intersection = A & B;',
      name: 'should allow intersection type',
    },
    {
      code: 'type Generic<T> = T | null;',
      name: 'should allow generic with null',
    },
    {
      code: 'type ArrayType = string[] | number[];',
      name: 'should allow array type union',
    },
    {
      code: 'type Flags = true | false;',
      name: 'should allow boolean literal union',
    },
    {
      code: 'type T = `foo`;',
      name: 'should allow single template literal type',
    },
  ],
  invalid: [
    {
      code: 'type Status = "active" | "inactive";',
      name: 'should report string literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Size = "small" | "medium" | "large";',
      name: 'should report multiple string literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Count = 1 | 2 | 3;',
      name: 'should report number literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Mixed = "yes" | "no" | boolean;',
      name: 'should report mixed literal and non-literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type MixedBooleanLiteral = true | "yes";',
      name: 'should report boolean literal mixed with string literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Complex = "a" | "b" | string;',
      name: 'should report literal union with type widening',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";',
      name: 'should report HTTP method literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Version = 1 | 2 | 3 | 4;',
      name: 'should report version number literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Direction = "up" | "down" | "left" | "right";',
      name: 'should report direction literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Slug = `a-${string}` | "fixed";',
      name: 'should report template literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
  ],
});
