import { ruleTester } from '../testing/test-helper';
import { noLiteralUnions } from './no-literal-unions';

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
    {
      code: 'const ACTIVE = getStatus(); const INACTIVE = getStatus(); type Status = typeof ACTIVE | typeof INACTIVE;',
      name: 'should allow typeof unions that do not fully resolve to literal const values',
    },
    {
      code: 'const ENABLED = true; const DISABLED = false; type Toggle = typeof ENABLED | typeof DISABLED;',
      name: 'should allow boolean literal unions hidden behind const typeof references',
    },
    {
      code: 'const ENABLED = true; const DISABLED = false; export type Toggle = typeof ENABLED | typeof DISABLED;',
      name: 'should allow exported boolean literal unions hidden behind const typeof references',
    },
  ],
  invalid: [
    {
      code: 'type Status = "active" | "inactive";',
      name: 'should report string literal union',
      output: 'enum Status { Active = "active", Inactive = "inactive" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Size = "small" | "medium" | "large";',
      name: 'should report multiple string literals',
      output: 'enum Size { Small = "small", Medium = "medium", Large = "large" }',
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
      output: 'enum HttpMethod { GET = "GET", POST = "POST", PUT = "PUT", DELETE = "DELETE" }',
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
      output: 'enum Direction { Up = "up", Down = "down", Left = "left", Right = "right" }',
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
    {
      code: 'export type RequireJsdocFunctionsMessageId = "missingJsdoc" | "missingJsdocParam";',
      name: 'should autofix exported string literal union type aliases to exported enums',
      output:
        'export enum RequireJsdocFunctionsMessageId { MissingJsdoc = "missingJsdoc", MissingJsdocParam = "missingJsdocParam" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Duplicates = "a-b" | "a b";',
      name: 'should autofix duplicate enum member names by appending numeric suffixes',
      output: 'enum Duplicates { AB = "a-b", AB2 = "a b" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type EmptyLiteral = "" | "active";',
      name: 'should autofix empty string literal union members using fallback enum member names',
      output: 'enum EmptyLiteral { Value1 = "", Active = "active" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type AuthMode = "2fa" | "password";',
      name: 'should autofix numeric-leading string literals with prefixed enum member names',
      output: 'enum AuthMode { Value2fa = "2fa", Password = "password" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: String.raw`type Escapes = "\"" | "\\" | "\n";`,
      name: 'should autofix escaped literals using safe enum initializer serialization',
      output: String.raw`enum Escapes { Value1 = "\"", Value2 = "\\", Value3 = "\n" }`,
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'declare type Stage = "dev" | "prod";',
      name: 'should preserve declare modifier when autofixing type aliases',
      output: 'declare enum Stage { Dev = "dev", Prod = "prod" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type GenericStatus<T> = "active" | "inactive";',
      name: 'should report generic type aliases without offering enum autofix',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'function run(mode: "fast" | "safe") {}',
      name: 'should report non-alias literal unions without offering enum autofix',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: "const ACTIVE = 'active'; const INACTIVE = 'inactive'; export type Status = typeof ACTIVE | typeof INACTIVE;",
      name: 'should report typeof unions that resolve to string literal const values',
      output:
        'const ACTIVE = \'active\'; const INACTIVE = \'inactive\'; export enum Status { ACTIVE = "active", INACTIVE = "inactive" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: "const ACTIVE = 'active'; export type Status = typeof ACTIVE | 'inactive';",
      name: 'should autofix mixed string literals and typeof string literal const references to exported enums',
      output:
        'const ACTIVE = \'active\'; export enum Status { ACTIVE = "active", Inactive = "inactive" }',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'const DRAFT = 0; const PUBLISHED = 1; export type Status = typeof DRAFT | typeof PUBLISHED;',
      name: 'should report typeof unions that resolve to numeric literal const values without autofix',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: "const ACTIVE = 'active'; const UNKNOWN = getStatus(); export type Status = typeof ACTIVE | typeof UNKNOWN;",
      name: 'should report typeof unions that mix literal const references with non-literal const references',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
  ],
});
