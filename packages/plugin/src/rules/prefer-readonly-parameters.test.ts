import { ruleTester } from '../testing/test-helper';
import { preferReadonlyParameters } from './prefer-readonly-parameters';

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
      name: 'should allow React Dispatch parameter type because it is callable',
      code: 'function update(setName: Dispatch<SetStateAction<string>>) { setName("ready"); }',
    },
    {
      name: 'should allow qualified React Dispatch parameter type because it is callable',
      code: 'function update(setName: React.Dispatch<React.SetStateAction<string>>) { setName("ready"); }',
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
    {
      name: 'should allow readonly constructor parameter property with Readonly type',
      code: 'class Service { constructor(private readonly user: Readonly<User>) {} }',
    },
    {
      name: 'should allow readonly constructor parameter property with ReadonlyArray type',
      code: 'class Service { constructor(private readonly items: ReadonlyArray<string>) {} }',
    },
    {
      name: 'should allow constructor parameter property with primitive type',
      code: 'class Service { constructor(private count: number) {} }',
    },
    {
      name: 'should allow constructor parameter property without type annotation',
      code: 'class Service { constructor(private user) {} }',
    },
    {
      name: 'should allow readonly constructor parameter property with Readonly type and default value',
      code: 'class Service { constructor(private readonly user: Readonly<User> = {}) {} }',
    },
    {
      name: 'should allow configured ignored type reference parameter',
      code: 'function subscribe(listener: Listener) { listener(); }',
      options: [{ ignoredTypeNamePatterns: ['^Listener$'] }],
    },
  ],
  invalid: [
    {
      name: 'should disallow mutable type reference parameter',
      code: 'function format(user: User) { return user.name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
      output: 'function format(user: Readonly<User>) { return user.name; }',
    },
    {
      name: 'should disallow mutable array parameter',
      code: 'function total(values: number[]) { return values.length; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'values' } }],
      output: 'function total(values: readonly number[]) { return values.length; }',
    },
    {
      name: 'should disallow mutable tuple parameter',
      code: 'function format(pair: [string, number]) { return pair[0]; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'pair' } }],
      output: 'function format(pair: readonly [string, number]) { return pair[0]; }',
    },
    {
      name: 'should disallow mutable inline type literal',
      code: 'function format(user: { name: string }) { return user.name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
      output: null,
    },
    {
      name: 'should disallow destructured assignment parameter with mutable type',
      code: 'function format({ name }: { name: string } = { name: "a" }) { return name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'destructured parameter' } }],
      output: null,
    },
    {
      name: 'should disallow assignment parameter with mutable identifier type',
      code: 'function format(user: User = defaultUser) { return user.name; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
      output: 'function format(user: Readonly<User> = defaultUser) { return user.name; }',
    },
    {
      name: 'should disallow mutable rest parameter type',
      code: 'function list(...items: string[]) { return items.length; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'items' } }],
      output: 'function list(...items: readonly string[]) { return items.length; }',
    },
    {
      name: 'should disallow mutable array pattern parameter type',
      code: 'function first([value]: [number]) { return value; }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'destructured parameter' } }],
      output: 'function first([value]: readonly [number]) { return value; }',
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
      output: `
        namespace Api {
          export type Input<T> = T;
        }
        function format(user: Readonly<Api.Input<User>>) { return user.name; }
      `,
    },
    {
      name: 'should disallow mutable constructor parameter property with type reference',
      code: 'class Service { constructor(private user: User) {} }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
      output: 'class Service { constructor(private user: Readonly<User>) {} }',
    },
    {
      name: 'should disallow mutable constructor parameter property with array type',
      code: 'class Service { constructor(public items: string[]) {} }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'items' } }],
      output: 'class Service { constructor(public items: readonly string[]) {} }',
    },
    {
      name: 'should disallow mutable constructor parameter property with inline type literal',
      code: 'class Service { constructor(protected config: { host: string }) {} }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'config' } }],
      output: null,
    },
    {
      name: 'should disallow mutable constructor parameter property with type reference and default value',
      code: 'class Service { constructor(private user: User = defaultUser) {} }',
      errors: [{ messageId: 'preferReadonlyParameter', data: { name: 'user' } }],
      output: 'class Service { constructor(private user: Readonly<User> = defaultUser) {} }',
    },
  ],
});
