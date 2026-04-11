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
import { noLiteralPropertyUnions } from './no-literal-property-unions';

ruleTester.run('no-literal-property-unions', noLiteralPropertyUnions, {
  valid: [
    {
      code: 'interface IAstLangSearchMatch { mode: SearchMode; }',
      name: 'should allow interface properties typed as enums or named types',
    },
    {
      code: 'interface IAstLangSearchMatch { mode?: SearchMode; }',
      name: 'should allow optional interface properties typed as enums or named types',
    },
    {
      code: 'type SearchMatch = { mode: SearchMode; };',
      name: 'should allow type literal properties typed as enums or named types',
    },
    {
      code: 'class SearchMatch { mode: SearchMode; }',
      name: 'should allow class properties typed as enums or named types',
    },
    {
      code: 'abstract class SearchMatch { abstract mode: SearchMode; }',
      name: 'should allow abstract class properties typed as enums or named types',
    },
    {
      code: 'interface IAstLangSearchMatch { mode: SearchMode | undefined; }',
      name: 'should allow property unions without literal value members',
    },
    {
      code: 'interface IToggle { enabled: true | false; }',
      name: 'should allow boolean property unions that cover the boolean domain',
    },
    {
      code: 'function run(mode: "tree-sitter" | "text-hint") {}',
      name: 'should ignore non-property literal unions',
    },
    {
      code: 'type SearchMode = "tree-sitter" | "text-hint";',
      name: 'should ignore type alias literal unions',
    },
    {
      code: 'interface ISearchMatch { id: 1n | 2n; }',
      name: 'should allow interface properties with bigint literal value options',
    },
  ],
  invalid: [
    {
      code: 'export interface IAstLangSearchMatch { mode: "tree-sitter" | "ripgrep-prefilter" | "text-hint"; }',
      name: 'should report interface properties with string literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'interface IAstLangSearchMatch { readonly mode?: "tree-sitter" | "text-hint"; }',
      name: 'should report readonly optional interface properties with string literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'type SearchMatch = { mode: "tree-sitter" | "text-hint"; };',
      name: 'should report type literal properties with string literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { exitCode: 0 | 1 | 2; }',
      name: 'should report interface properties with number literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'exitCode' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { exitCode: -1 | 0; }',
      name: 'should report interface properties with negative number literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'exitCode' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { value: "missing" | 0; }',
      name: 'should report interface properties with mixed string and number literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'value' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { mode: "tree-sitter" | "text-hint" | undefined; }',
      name: 'should report interface properties with literal value options and undefined',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { mode: "tree-sitter" | string; }',
      name: 'should report property unions with widened string members',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { mode: "tree-sitter" | null; }',
      name: 'should report property unions with a literal value and null',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { value: true | "yes"; }',
      name: 'should report property unions that mix boolean literals with other literal values',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'value' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { slug: `a-${string}` | `b-${string}`; }',
      name: 'should report property unions with template literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'slug' },
        },
      ],
    },
    {
      code: 'class SearchMatch { mode: "tree-sitter" | "text-hint"; }',
      name: 'should report class properties with string literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'abstract class SearchMatch { abstract mode: "tree-sitter" | "text-hint"; }',
      name: 'should report abstract class properties with string literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'mode' },
        },
      ],
    },
    {
      code: 'interface ISearchMatch { "search-mode": "tree-sitter" | "text-hint"; }',
      name: 'should report string-named properties with literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'search-mode' },
        },
      ],
    },
    {
      code: 'const key = "mode"; class SearchMatch { [key]: "tree-sitter" | "text-hint"; }',
      name: 'should report computed properties with literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: 'key' },
        },
      ],
    },
    {
      code: 'class SearchMatch { #mode: "tree-sitter" | "text-hint"; }',
      name: 'should report private properties with literal value options',
      errors: [
        {
          messageId: 'noLiteralPropertyUnions',
          data: { name: '#mode' },
        },
      ],
    },
  ],
});
