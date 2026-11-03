import process from 'node:process';
import * as parser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { ruleTester } from '../testing/test-helper';
import { noArrayMutation } from './no-array-mutation';

describe('no-array-mutation', () => {
  ruleTester.run('no-array-mutation', noArrayMutation, {
    valid: [
      {
        name: 'should allow cast custom receiver optional methods',
        code: 'const router = { push(value: number) {} } as { push(value: number): void }; router?.["push"]?.(1);',
      },
      {
        name: 'should respect a shadowed array binding',
        code: 'const list = []; function run(list: { push(n: number): void }) { list.push(1); }',
      },
      {
        name: 'should allow nonmutating optional computed calls',
        code: 'const list = [] as number[]; list?.["slice"]?.();',
      },
      {
        name: 'should avoid inferring an array from a cast alone',
        code: '(external as number[]).push(1);',
      },
      { name: 'should allow router push', code: 'router.push("/home");' },
      { name: 'should allow custom sorting', code: 'const custom = { sort() {} }; custom.sort();' },
      {
        name: 'should allow reassigned array binding',
        code: 'let list = []; list = router; list.push(1);',
      },
      { name: 'should allow cyclic aliases', code: 'const a = b; const b = a; a.push(1);' },
      { name: 'should allow unrecognized direct calls', code: 'push(item);' },
      {
        name: 'should allow non-mutating slice call',
        code: 'const out = items.slice(0);',
      },
      {
        name: 'should allow non-member call expression',
        code: 'mutate(items);',
      },
      {
        name: 'should allow unknown member method',
        code: 'const items = []; items.map((value) => value + 1);',
      },
      {
        name: 'should allow computed member with non-mutating name',
        code: "const items = []; items['map']((value) => value + 1);",
      },
    ],
    invalid: [
      {
        name: 'should report optional computed mutation',
        code: 'const list = []; list?.["push"]?.(1);',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should report angle asserted array literal',
        code: '(<number[]>[]).push(1);',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should report nonnull array alias',
        code: 'const list = []; list!.pop();',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should report nested satisfies and assertion wrappers',
        code: '(([] as number[]) satisfies number[]).reverse();',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should report literal receiver',
        code: '[].push(1);',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should report stable array aliases',
        code: 'const list = []; const alias = list; alias.pop();',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should report asserted literal',
        code: 'const list = [] as number[]; list.push(1);',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should report satisfies literal',
        code: 'const list = [] satisfies number[]; list.push(1);',
        errors: [{ messageId: 'noArrayMutation' }],
      },
      {
        name: 'should disallow push mutation',
        code: 'const items = []; items.push(value);',
        errors: [{ messageId: 'noArrayMutation', data: { method: 'push' } }],
      },
      {
        name: 'should disallow sort mutation',
        code: 'const items = []; items.sort();',
        errors: [{ messageId: 'noArrayMutation', data: { method: 'sort' } }],
      },
      {
        name: 'should disallow splice mutation via computed member',
        code: "const items = []; items['splice'](0, 1);",
        errors: [{ messageId: 'noArrayMutation', data: { method: 'splice' } }],
      },
      {
        name: 'should disallow reverse mutation',
        code: 'const items = []; items.reverse();',
        errors: [{ messageId: 'noArrayMutation', data: { method: 'reverse' } }],
      },
    ],
  });

  const typedTester = new RuleTester({
    languageOptions: {
      parser,
      parserOptions: {
        projectService: { allowDefaultProject: ['src/array-fixture.ts'] },
        tsconfigRootDir: process.cwd(),
      },
    },
  });
  describe('typed array receivers', () => {
    typedTester.run('no-array-mutation', noArrayMutation, {
      valid: [
        {
          name: 'should allow unrelated class hierarchies',
          filename: 'src/array-fixture.ts',
          code: 'class Router { push(value: number) {} } class AppRouter extends Router {} new AppRouter().push(1);',
        },
        {
          name: 'should allow unrelated intersections',
          filename: 'src/array-fixture.ts',
          code: 'function run(value: { push(n: number): void } & { tag: string }) { value.push(1); }',
        },
        {
          name: 'should allow typed custom push',
          filename: 'src/array-fixture.ts',
          code: 'function run(router: { push(path: string): void }) { router.push("/"); }',
        },
        {
          name: 'should allow unknown receivers',
          filename: 'src/array-fixture.ts',
          code: 'function run(value: any) { value.push(1); }',
        },
      ],
      invalid: [
        {
          name: 'should report array subclass mutation',
          code: 'class Items extends Array<number> {} const items = new Items(); items.push(1);',
          filename: 'src/array-fixture.ts',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should report indirect generic array subclasses',
          code: 'class Items<T> extends Array<T> {} class Numbers extends Items<number> {} new Numbers().reverse();',
          filename: 'src/array-fixture.ts',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should report branded array intersections',
          code: 'function mutate(items: number[] & { tag: string }) { items.push(1); }',
          filename: 'src/array-fixture.ts',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should report interfaces extending arrays',
          code: 'interface Items extends Array<number> { tag: string; } function mutate(items: Items) { items.pop(); }',
          filename: 'src/array-fixture.ts',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should report tuple intersections',
          code: 'function mutate(items: [number] & { tag: string }) { items.reverse(); }',
          filename: 'src/array-fixture.ts',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should detect typed array parameters',
          filename: 'src/array-fixture.ts',
          code: 'function run(items: number[]) { items.push(1); }',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should detect tuples',
          filename: 'src/array-fixture.ts',
          code: 'function run(items: [number]) { items.reverse(); }',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should detect constrained generics',
          filename: 'src/array-fixture.ts',
          code: 'function run<T extends number[]>(items: T) { items.pop(); }',
          errors: [{ messageId: 'noArrayMutation' }],
        },
        {
          name: 'should detect optional union receivers',
          filename: 'src/array-fixture.ts',
          code: 'function run(items: number[] | undefined) { items?.push(1); }',
          errors: [{ messageId: 'noArrayMutation' }],
        },
      ],
    });
  });
});
