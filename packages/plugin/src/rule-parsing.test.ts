import * as tsParser from '@typescript-eslint/parser';
import { type ESLint, Linter } from 'eslint';
import eslintPlugin from './index';

const SYNTAX_FIXTURES = [
  { name: 'empty modules', filename: 'audit.ts', code: '' },
  {
    name: 'prototype properties and optional calls',
    filename: 'audit.test.ts',
    code: 'value.toString(); value?.valueOf?.(); value["constructor"]; value?.["__proto__"];',
  },
  {
    name: 'computed and private member names',
    filename: 'audit.ts',
    code: 'class Example { #value = 1; read(key: string) { return this.#value + this[key]; } }',
  },
  {
    name: 'generic functions and assertions',
    filename: 'audit.ts',
    code: 'const identity = <T,>(value: T): T => value; const result = identity<string>("text") satisfies string;',
  },
  {
    name: 'JSX and readonly props',
    filename: 'audit.tsx',
    code: 'export const Example = (props: Readonly<{title: string}>) => <span>{props.title}</span>;',
  },
  {
    name: 'ambient declarations and overloads',
    filename: 'audit.d.ts',
    code: 'export declare function read(value: string): string; export declare function read(value: number): number;',
  },
  {
    name: 'barrel export variants',
    filename: 'index.ts',
    code: 'export type { Item } from "./item"; export * as items from "./items";',
  },
  {
    name: 'destructuring and nested function scopes',
    filename: 'audit.ts',
    code: 'function read({value = 1}, ...items: number[]) { return () => { let next = value; return next++; }; }',
  },
  {
    name: 'async loops and dynamic imports',
    filename: 'audit.ts',
    code: 'async function load() { for await (const item of stream) { await import(item); } }',
  },
  {
    name: 'negated and chained Jest matchers',
    filename: 'audit.test.ts',
    code: 'expect(fn).resolves.not.toHaveBeenCalled(); jest.fn<string>().mockReturnValueOnce("ok");',
  },
  {
    name: 'regular expressions and templates',
    filename: 'audit.ts',
    code: 'const pattern = /\\p{Letter}+/u; const text = String.raw`\\d+`; const value = `prefix${text}`;',
  },
  {
    name: 'script grammar',
    filename: 'audit.js',
    code: 'function read(value) { return value?.toString() ?? ""; }',
  },
];

describe('rule parser compatibility', () => {
  const linter = new Linter();
  const plugin: ESLint.Plugin = { rules: Reflect.get(eslintPlugin, 'rules') };

  for (const ruleName of Object.keys(eslintPlugin.rules)) {
    it.each(SYNTAX_FIXTURES)(`should lint $name without crashing with ${ruleName}`, (fixture) => {
      const messages = linter.verify(
        fixture.code,
        [
          {
            files: ['**/*.{ts,tsx,js}'],
            languageOptions: { parser: tsParser },
            plugins: { 'zero-tolerance': plugin },
            rules: { [`zero-tolerance/${ruleName}`]: 'error' },
          },
        ],
        { filename: fixture.filename },
      );

      expect(messages.filter((message) => message.fatal)).toEqual([]);
      expect(messages.filter((message) => message.ruleId === null)).toEqual([]);
    });
  }
});
