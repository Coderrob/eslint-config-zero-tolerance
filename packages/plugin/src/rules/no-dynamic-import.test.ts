import { ruleTester } from '../testing/test-helper';
import { noDynamicImport } from './no-dynamic-import';

ruleTester.run('no-dynamic-import', noDynamicImport, {
  valid: [
    {
      code: 'import { foo } from "./module";',
      filename: 'src/file.ts',
      name: 'should allow static import in regular file',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.test.ts',
      name: 'should allow dynamic import in .test.ts file',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.spec.ts',
      name: 'should allow require in .spec.ts file',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.test.js',
      name: 'should allow dynamic import in .test.js file',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.spec.js',
      name: 'should allow require in .spec.js file',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.test.tsx',
      name: 'should allow dynamic import in .test.tsx file',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.spec.jsx',
      name: 'should allow require in .spec.jsx file',
    },
    {
      code: 'import("./module").then(m => m.default);',
      filename: 'src/file.test.ts',
      name: 'should allow import expression in test file',
    },
    {
      code: 'import("./module").then(m => m.default);',
      filename: 'src/__tests__/file.ts',
      name: 'should allow dynamic import in __tests__ directory',
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/features/auth.integration.ts',
      name: 'should allow require in integration test file',
    },
    {
      code: 'const module = await import("./module");',
      filename: 'src/e2e/login.e2e.ts',
      name: 'should allow dynamic import in e2e test file',
    },
  ],
  invalid: [
    {
      code: 'const module = await import("./module");',
      filename: 'src/file.ts',
      name: 'should report dynamic import in regular file',
      errors: [
        {
          messageId: 'noDynamicImport',
        },
      ],
    },
    {
      code: 'const module = require("./module");',
      filename: 'src/file.ts',
      name: 'should report require in regular file',
      errors: [
        {
          messageId: 'noRequire',
        },
      ],
    },
    {
      code: 'const pkg = require("package");',
      filename: 'src/index.ts',
      name: 'should report require npm package in regular file',
      errors: [
        {
          messageId: 'noRequire',
        },
      ],
    },
    {
      code: 'async function loadModule() { return await import("./mod"); }',
      filename: 'src/utils.ts',
      name: 'should report dynamic import in function',
      errors: [
        {
          messageId: 'noDynamicImport',
        },
      ],
    },
    {
      code: 'import("./mod").then(m => m.default);',
      filename: 'src/utils.ts',
      name: 'should report non-await dynamic import in regular file',
      errors: [
        {
          messageId: 'noDynamicImport',
        },
      ],
    },
    {
      code: 'const conditionalRequire = condition ? require("a") : require("b");',
      filename: 'src/app.ts',
      name: 'should report conditional require',
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
      name: 'should report multiple requires',
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
});
