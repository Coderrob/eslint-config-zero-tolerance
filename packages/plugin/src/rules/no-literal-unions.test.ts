/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ruleTester } from '../testing/test-helper';
import { noLiteralUnions } from './no-literal-unions';

describe('no-literal-unions', () => {
  ruleTester.run('no-literal-unions', noLiteralUnions, {
    valid: [
      {
        name: 'should not reuse constants from another file',
        code: 'type Status = typeof ACTIVE | typeof IDLE;',
      },

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
        code: 'export type Value = string | number;',
        name: 'should allow exported unions of non-literal types',
      },
      {
        code: 'const ACTIVE = getStatus(); const INACTIVE = getStatus(); type Status = typeof ACTIVE | typeof INACTIVE;',
        name: 'should allow typeof unions that do not fully resolve to literal const values',
      },
      {
        code: "const ACTIVE = 'active'; const INACTIVE = 'inactive'; function run(mode: typeof ACTIVE | typeof INACTIVE) {}",
        name: 'should allow non-alias typeof unions that resolve to literal const values',
      },
      {
        code: 'interface ISearchMatch { mode: "tree-sitter" | "text-hint"; }',
        name: 'should allow property literal unions handled by the property-specific rule',
      },
      {
        code: 'class SearchMatch { mode: "tree-sitter" | "text-hint"; }',
        name: 'should allow class property literal unions handled by the property-specific rule',
      },
      {
        code: [
          'type PublicUser = Omit<User, "password" | "token">;',
          'type NamedUser = Pick<User, "id" | "name">;',
          'type UsersByRole = Record<"admin" | "guest", User>;',
        ].join('\n'),
        name: 'should allow literal unions inside property-key utility types',
      },
      {
        code: [
          'type NonDraftStatus = Exclude<Status, "draft" | "archived">;',
          'type VisibleStatus = Extract<Status, "published" | "scheduled">;',
          'type RequiredStatus = NonNullable<"active" | "inactive" | null>;',
        ].join('\n'),
        name: 'should allow literal unions inside filtering utility types',
      },
      {
        code: [
          'type CallbackArgs = Parameters<(mode: "fast" | "safe") => void>;',
          'type CallbackResult = ReturnType<() => "success" | "failure">;',
        ].join('\n'),
        name: 'should allow literal unions inside function utility types',
      },
      {
        code: 'const ENABLED = true; const DISABLED = false; type Toggle = typeof ENABLED | typeof DISABLED;',
        name: 'should allow boolean literal unions hidden behind const typeof references',
      },
      {
        code: 'const ENABLED = true; const DISABLED = false; export type Toggle = typeof ENABLED | typeof DISABLED;',
        name: 'should allow exported boolean literal unions hidden behind const typeof references',
      },
      {
        code: "declare const ACTIVE: 'active'; export type Status = typeof ACTIVE | typeof ACTIVE;",
        name: 'should allow typeof unions backed by const declarations without initializers',
      },
      {
        code: 'const { ACTIVE } = values; export type Status = typeof ACTIVE | typeof ACTIVE;',
        name: 'should allow typeof unions backed by destructured const declarations',
      },
      {
        code: "let ACTIVE = 'active'; export type Status = typeof ACTIVE | typeof ACTIVE;",
        name: 'should allow typeof unions backed by non-const declarations',
      },
    ],
    invalid: [
      {
        name: 'should preserve assignability of existing literal values',
        code: 'type Status = "active" | "inactive"; const current: Status = "active";',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        name: 'should resolve constants independently for each file',
        code: 'const ACTIVE = "active"; const IDLE = "idle"; type Status = typeof ACTIVE | typeof IDLE;',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },

      {
        code: 'type Status = "active" | "inactive";',
        name: 'should report string literal union',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: 'type Size = "small" | "medium" | "large";',
        name: 'should report multiple string literals',
        output: null,
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
        output: null,
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
        output: null,
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
        name: 'should report exported string unions without changing the declaration kind',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: 'type Duplicates = "a-b" | "a b";',
        name: 'should report literals whose generated member names would collide without rewriting',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: 'type EmptyLiteral = "" | "active";',
        name: 'should report empty string union members without synthesizing enum values',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: 'type AuthMode = "2fa" | "password";',
        name: 'should report numeric-leading string literals without synthesizing enum names',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: String.raw`type Escapes = "\"" | "\\" | "\n";`,
        name: 'should report escaped literal values without rewriting their representation',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: 'declare type Stage = "dev" | "prod";',
        name: 'should report ambient type aliases without changing their declaration',
        output: null,
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
        code: 'type WrappedStatus = CustomUtility<"active" | "inactive">;',
        name: 'should report literal unions inside custom generic type arguments',
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: "const ACTIVE = 'active'; const INACTIVE = 'inactive'; export type Status = typeof ACTIVE | typeof INACTIVE;",
        name: 'should report typeof unions that resolve to string literal const values',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: "const ACTIVE = 'active'; const INACTIVE = 'inactive'; type Status = typeof ACTIVE | typeof INACTIVE;",
        name: 'should report non-exported typeof unions that resolve to string literal const values',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: "export const ACTIVE = 'active'; const INACTIVE = 'inactive'; export type Status = typeof ACTIVE | typeof INACTIVE;",
        name: 'should report typeof unions that resolve to exported string literal const values',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: "const ACTIVE = 'active'; export type Status = typeof ACTIVE | 'inactive';",
        name: 'should report exported mixed literal and const-reference unions without rewriting',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: "const ACTIVE = 'active'; type Status = typeof ACTIVE | 'inactive';",
        name: 'should report mixed literal and const-reference unions without rewriting',
        output: null,
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: 'const ACTIVE = `active`; export type Status = typeof ACTIVE | "inactive";',
        name: 'should report without rewriting typeof unions that resolve through no-substitution template literal const values',
        output: null,
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
        code: 'const DRAFT = 0; const PUBLISHED = 1; type Status = typeof DRAFT | typeof PUBLISHED;',
        name: 'should report non-exported typeof unions that resolve to numeric literal const values without autofix',
        errors: [
          {
            messageId: 'noLiteralUnions',
          },
        ],
      },
      {
        code: 'const NEGATIVE = -1; const ZERO = 0; export type Status = typeof NEGATIVE | typeof ZERO;',
        name: 'should report typeof unions that resolve to negative numeric literal const values without autofix',
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
});
