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
  ],
  invalid: [
    {
      code: 'export { foo as bar };',
      name: 'named export with alias',
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
      errors: [
        {
          messageId: 'noExportAlias',
          data: { local: 'alpha', alias: 'beta' },
        },
      ],
    },
  ],
} as any);
