import { TSESLint } from '@typescript-eslint/utils';
import { noDynamicImport } from './no-dynamic-import';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('no-dynamic-import', noDynamicImport, {
  valid: [
    {
      code: 'import { foo } from "./module";',
      filename: 'src/file.ts',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.test.ts',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.spec.ts',
    },
  ],
  invalid: [
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.ts',
      errors: [
        {
          messageId: 'noDynamicImport',
        },
      ],
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.ts',
      errors: [
        {
          messageId: 'noRequire',
        },
      ],
    },
    {
      code: 'const pkg = require("package");',
      filename: 'src/index.ts',
      errors: [
        {
          messageId: 'noRequire',
        },
      ],
    },
  ],
});
