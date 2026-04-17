import process from 'node:process';
import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noMapSetMutation } from './no-map-set-mutation';

const typeAwareRuleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      projectService: {
        allowDefaultProject: ['src/*.ts', 'src/*.tsx'],
      },
      tsconfigRootDir: process.cwd(),
    },
  },
});

const untypedRuleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

typeAwareRuleTester.run('no-map-set-mutation', noMapSetMutation, {
  valid: [
    {
      name: 'should allow non-member Map calls',
      code: `
        const cache = new Map<string, number>();
        useCache(cache);
        function useCache(input: Map<string, number>): Map<string, number> {
          return input;
        }
      `,
      filename: 'src/cache.ts',
    },
    {
      name: 'should allow non-mutating Map lookups',
      code: 'const cache = new Map<string, number>(); cache.get("answer");',
      filename: 'src/cache.ts',
    },
    {
      name: 'should allow computed member access',
      code: 'const cache = new Map<string, number>(); cache["set"]("answer", 42);',
      filename: 'src/cache.ts',
    },
    {
      name: 'should allow non-mutating Set checks',
      code: 'const ids = new Set<string>(); ids.has("abc");',
      filename: 'src/ids.ts',
    },
    {
      name: 'should allow custom objects with set methods',
      code: 'const builder = { set(value: string) { return value; } }; builder.set("x");',
      filename: 'src/builder.ts',
    },
  ],
  invalid: [
    {
      name: 'should disallow Map set mutations',
      code: 'const cache = new Map<string, number>(); cache.set("answer", 42);',
      filename: 'src/cache.ts',
      errors: [{ messageId: 'noMapSetMutation' }],
    },
    {
      name: 'should disallow Map delete mutations',
      code: 'const cache = new Map<string, number>(); cache.delete("answer");',
      filename: 'src/cache.ts',
      errors: [{ messageId: 'noMapSetMutation' }],
    },
    {
      name: 'should disallow Set add mutations',
      code: 'const ids = new Set<string>(); ids.add("abc");',
      filename: 'src/ids.ts',
      errors: [{ messageId: 'noMapSetMutation' }],
    },
    {
      name: 'should disallow Set clear mutations',
      code: 'const ids = new Set<string>(); ids.clear();',
      filename: 'src/ids.ts',
      errors: [{ messageId: 'noMapSetMutation' }],
    },
    {
      name: 'should disallow union typed Map mutations',
      code: `
        const cache: Map<string, number> | ReadonlyMap<string, number> = new Map<string, number>();
        cache.set("answer", 42);
      `,
      filename: 'src/cache.ts',
      errors: [{ messageId: 'noMapSetMutation' }],
    },
  ],
});

untypedRuleTester.run('no-map-set-mutation without type information', noMapSetMutation, {
  valid: [
    {
      name: 'should ignore mutations when parser services are unavailable',
      code: 'const cache = new Map(); cache.set("answer", 42);',
      filename: 'src/cache.ts',
    },
  ],
  invalid: [],
});
