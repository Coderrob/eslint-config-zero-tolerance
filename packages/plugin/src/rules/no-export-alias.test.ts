import { ruleTester } from '../testing/test-helper';
import { noExportAlias } from './no-export-alias';

ruleTester.run('no-export-alias', noExportAlias, {
  valid: [
    {
      code: 'export { foo };',
      name: 'should allow direct named export without alias',
    },
    {
      code: 'export { foo, bar };',
      name: 'should allow multiple direct named exports without alias',
    },
    {
      code: "export { foo } from './module';",
      name: 'should allow re-export without alias',
    },
    {
      code: "export { foo, bar } from './module';",
      name: 'should allow multiple re-exports without alias',
    },
    {
      code: 'export default foo;',
      name: 'should allow default export',
    },
    {
      code: 'export const value = 42;',
      name: 'should allow direct const export',
    },
    {
      code: 'export function myFunction() {}',
      name: 'should allow direct function export',
    },
    {
      code: "export * from './module';",
      name: 'should allow wildcard re-export',
    },
    {
      code: 'export { foo as "foo" };',
      name: 'should allow string literal export name without alias',
    },
    {
      code: 'export { type Foo };',
      name: 'should allow type-only export without alias',
    },
  ],
  invalid: [
    {
      code: 'export { foo as bar };',
      name: 'should report named export with alias',
      output: null,
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'foo', alias: 'bar' },
        },
      ],
    },
    {
      code: "export { foo as bar } from './module';",
      name: 'should report re-export with alias',
      output: null,
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'foo', alias: 'bar' },
        },
      ],
    },
    {
      code: 'export { MyClass as default };',
      name: 'should report export aliased as default',
      output: null,
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'MyClass', alias: 'default' },
        },
      ],
    },
    {
      code: 'export { foo as bar, baz as qux };',
      name: 'should report multiple aliased exports',
      output: null,
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
      name: 'should report mixed aliased and direct re-exports',
      output: null,
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'alpha', alias: 'beta' },
        },
      ],
    },
    {
      code: 'export { foo as "bar" };',
      name: 'should report string literal export alias',
      output: null,
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'foo', alias: 'bar' },
        },
      ],
    },
    {
      code: 'export { type Foo as Bar };',
      name: 'should report type-only export with alias and preserve type modifier in autofix',
      output: null,
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'Foo', alias: 'Bar' },
        },
      ],
    },
    {
      code: "export { type Foo as Bar } from './module';",
      name: 'should report type-only re-export with alias and preserve type modifier in autofix',
      output: null,
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'Foo', alias: 'Bar' },
        },
      ],
    },
  ],
});
