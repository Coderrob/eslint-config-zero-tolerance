import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noDynamicImport } from './no-dynamic-import';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-dynamic-import', noDynamicImport, {
  valid: [
    {
      code: 'import { foo } from "./module";',
      filename: 'src/file.ts',
      name: 'static import in regular file',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.test.ts',
      name: 'dynamic import in .test.ts file',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.spec.ts',
      name: 'require in .spec.ts file',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.test.js',
      name: 'dynamic import in .test.js file',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.spec.js',
      name: 'require in .spec.js file',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.test.tsx',
      name: 'dynamic import in .test.tsx file',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.spec.jsx',
      name: 'require in .spec.jsx file',
    },
    {
      code: 'import("./module").then(m => m.default);',
      filename: 'src/file.test.ts',
      name: 'import expression in test file',
    },
  ],
  invalid: [
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.ts',
      name: 'dynamic import in regular file',
      errors: [
        {
          messageId: 'noDynamicImport',
        },
      ],
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.ts',
      name: 'require in regular file',
      errors: [
        {
          messageId: 'noRequire',
        },
      ],
    },
    {
      code: 'const pkg = require("package");',
      filename: 'src/index.ts',
      name: 'require npm package in regular file',
      errors: [
        {
          messageId: 'noRequire',
        },
      ],
    },
    {
      code: 'async function loadModule() { return await import("./mod"); }',
      filename: 'src/utils.ts',
      name: 'dynamic import in function',
      errors: [
        {
          messageId: 'noDynamicImport',
        },
      ],
    },
    {
      code: 'const conditionalRequire = condition ? require("a") : require("b");',
      filename: 'src/app.ts',
      name: 'conditional require',
      errors: [
        {
          messageId: 'noRequire',
        },
        {
          messageId: 'noRequire',
        },
      ],
    },
    {
      code: 'const mod = require("./module"); const mod2 = require("./module2");',
      filename: 'src/index.js',
      name: 'multiple requires',
      errors: [
        {
          messageId: 'noRequire',
        },
        {
          messageId: 'noRequire',
        },
      ],
    },
  ],
} as any);
