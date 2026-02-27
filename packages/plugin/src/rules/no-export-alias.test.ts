import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noExportAlias } from './no-export-alias';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-export-alias', noExportAlias, {
  valid: [
    {
      code: 'export { foo };',
      name: 'direct named export without alias',
    },
    {
      code: 'export { foo, bar };',
      name: 'multiple direct named exports without alias',
    },
    {
      code: "export { foo } from './module';",
      name: 're-export without alias',
    },
    {
      code: "export { foo, bar } from './module';",
      name: 'multiple re-exports without alias',
    },
    {
      code: 'export default foo;',
      name: 'default export',
    },
    {
      code: 'export const value = 42;',
      name: 'direct const export',
    },
    {
      code: 'export function myFunction() {}',
      name: 'direct function export',
    },
    {
      code: "export * from './module';",
      name: 'wildcard re-export',
    },
    {
      code: 'export { foo as "foo" };',
      name: 'string literal export name without alias',
    },
    {
      code: 'export { type Foo };',
      name: 'type-only export without alias',
    },
  ],
  invalid: [
    {
      code: 'export { foo as bar };',
      name: 'named export with alias',
      output: 'export { foo };',
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'foo', alias: 'bar' },
        },
      ],
    },
    {
      code: "export { foo as bar } from './module';",
      name: 're-export with alias',
      output: "export { foo } from './module';",
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'foo', alias: 'bar' },
        },
      ],
    },
    {
      code: 'export { MyClass as default };',
      name: 'export aliased as default',
      output: 'export { MyClass };',
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'MyClass', alias: 'default' },
        },
      ],
    },
    {
      code: 'export { foo as bar, baz as qux };',
      name: 'multiple aliased exports',
      output: 'export { foo, baz };',
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'foo', alias: 'bar' },
        },
        {
          messageId: 'noExportAlias',
          data: { local: 'baz', alias: 'qux' },
        },
      ],
    },
    {
      code: "export { alpha as beta, gamma } from './module';",
      name: 'mixed aliased and direct re-exports',
      output: "export { alpha, gamma } from './module';",
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'alpha', alias: 'beta' },
        },
      ],
    },
    {
      code: 'export { foo as "bar" };',
      name: 'string literal export alias',
      output: 'export { foo };',
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'foo', alias: 'bar' },
        },
      ],
    },
    {
      code: 'export { type Foo as Bar };',
      name: 'type-only export with alias preserves type modifier in autofix',
      output: 'export { type Foo };',
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'Foo', alias: 'Bar' },
        },
      ],
    },
    {
      code: "export { type Foo as Bar } from './module';",
      name: 'type-only re-export with alias preserves type modifier in autofix',
      output: "export { type Foo } from './module';",
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'Foo', alias: 'Bar' },
        },
      ],
    },
  ],
} as any);
