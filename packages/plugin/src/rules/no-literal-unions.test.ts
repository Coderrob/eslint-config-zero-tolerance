import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noLiteralUnions } from './no-literal-unions';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-literal-unions', noLiteralUnions, {
  valid: [
    {
      code: 'type Numbers = number | string;',
      name: 'non-literal union types',
    },
    {
      code: 'type Mixed = boolean | null | undefined;',
      name: 'boolean and null/undefined union',
    },
    {
      code: 'enum Status { Active = "active", Inactive = "inactive" }',
      name: 'enum definition',
    },
    {
      code: 'type MyType = string;',
      name: 'simple type alias',
    },
    {
      code: 'type UserType = User | Admin;',
      name: 'union of custom types',
    },
    {
      code: 'type Intersection = A & B;',
      name: 'intersection type',
    },
    {
      code: 'type Generic<T> = T | null;',
      name: 'generic with null',
    },
    {
      code: 'type ArrayType = string[] | number[];',
      name: 'array type union',
    },
  ],
  invalid: [
    {
      code: 'type Status = "active" | "inactive";',
      name: 'string literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Size = "small" | "medium" | "large";',
      name: 'multiple string literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Count = 1 | 2 | 3;',
      name: 'number literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Mixed = "yes" | "no" | boolean;',
      name: 'mixed literal and non-literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Flags = true | false;',
      name: 'boolean literal union',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Complex = "a" | "b" | string;',
      name: 'literal union with type widening',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";',
      name: 'HTTP method literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Version = 1 | 2 | 3 | 4;',
      name: 'version number literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Direction = "up" | "down" | "left" | "right";',
      name: 'direction literals',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
  ],
} as any);
