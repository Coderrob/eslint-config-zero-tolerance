import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { preferReadonlyParameters } from './prefer-readonly-parameters';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('prefer-readonly-parameters', preferReadonlyParameters, {
  valid: [
    {
      name: 'should allow primitive parameter types',
      code: 'function format(count: number): string { return String(count); }',
    },
    {
      name: 'should allow Readonly wrapped parameter type',
      code: 'function format(user: Readonly<User>) { return user.name; }',
    },
    {
      name: 'should allow ReadonlyArray parameter type',
      code: 'function total(values: ReadonlyArray<number>) { return values.length; }',
    },
    {
      name: 'should allow readonly array syntax',
      code: 'function total(values: readonly number[]) { return values.length; }',
    },
    {
      name: 'should allow readonly inline type literal',
      code: 'function format(user: { readonly name: string }) { return user.name; }',
    },
    {
      name: 'should allow missing parameter type annotation',
      code: 'const format = (user) => user;',
    },
    {
      name: 'should allow readonly rest parameter array',
      code: 'function list(...items: readonly string[]) { return items.length; }',
    },
    {
      name: 'should allow assignment parameter without type annotation',
      code: 'function format(user = defaultUser) { return user; }',
    },
  ],
  invalid: [
    {
      name: 'should disallow mutable type reference parameter',
      code: 'function format(user: User) { return user.name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
    },
    {
      name: 'should disallow mutable array parameter',
      code: 'function total(values: number[]) { return values.length; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'values' } }],
    },
    {
      name: 'should disallow mutable tuple parameter',
      code: 'function format(pair: [string, number]) { return pair[0]; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'pair' } }],
    },
    {
      name: 'should disallow mutable inline type literal',
      code: 'function format(user: { name: string }) { return user.name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
    },
    {
      name: 'should disallow destructured assignment parameter with mutable type',
      code: 'function format({ name }: { name: string } = { name: "a" }) { return name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'destructured parameter' } }],
    },
    {
      name: 'should disallow assignment parameter with mutable identifier type',
      code: 'function format(user: User = defaultUser) { return user.name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
    },
    {
      name: 'should disallow mutable rest parameter type',
      code: 'function list(...items: string[]) { return items.length; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'items' } }],
    },
    {
      name: 'should disallow mutable array pattern parameter type',
      code: 'function first([value]: [number]) { return value; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'destructured parameter' } }],
    },
    {
      name: 'should disallow qualified type reference parameter',
      code: `
        namespace Api {
          export type Input<T> = T;
        }
        function format(user: Api.Input<User>) { return user.name; }
      `,
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
    },
  ],
});
