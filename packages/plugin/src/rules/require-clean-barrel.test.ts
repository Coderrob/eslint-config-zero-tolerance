import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { requireCleanBarrel } from './require-clean-barrel';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('require-clean-barrel', requireCleanBarrel, {
  valid: [
    {
      code: 'const value = 1;\nexport { value };',
      name: 'should ignore non-barrel files',
      filename: 'src/utils.ts',
    },
    {
      code: "export { foo } from './foo';",
      name: 'should allow named module re-export in barrel file',
      filename: 'src/index.ts',
    },
    {
      code: "export * from './foo';",
      name: 'should allow wildcard module re-export in barrel file',
      filename: 'src/index.ts',
    },
    {
      code: "export type { Foo } from './types';",
      name: 'should allow type-only module re-export in barrel file',
      filename: 'src/index.ts',
    },
    {
      code: "export * as utils from './utils';",
      name: 'should allow namespace module re-export in barrel file',
      filename: 'src/index.ts',
    },
    {
      code: "export type * from './types';",
      name: 'should allow type wildcard module re-export in barrel file',
      filename: 'src/index.ts',
    },
    {
      code: "export { foo } from './foo';\nexport * from './bar';\nexport type { Baz } from './baz';",
      name: 'should allow mixed module re-exports in barrel file',
      filename: 'src/index.ts',
    },
    {
      code: "import packageJson from '../package.json';\nexport = packageJson;",
      name: 'should ignore index files that are not barrel aggregators',
      filename: 'src/index.ts',
    },
    {
      code: "export { foo } from './foo';",
      name: 'should allow single-extension JavaScript barrel files',
      filename: 'src/index.js',
    },
    {
      code: "export { foo } from './foo';",
      name: 'should allow single-extension module barrel files',
      filename: 'src/index.mts',
    },
    {
      code: 'declare const x: number;\nexport { x };',
      name: 'should ignore double-extension index files',
      filename: 'src/index.d.ts',
    },
    {
      code: "import helper from './helper';\nexport { helper };",
      name: 'should ignore test index files with double extensions',
      filename: 'src/index.test.ts',
    },
    {
      code: "import helper from './helper';\nexport { helper };",
      name: 'should ignore spec index files with double extensions',
      filename: 'src/index.spec.js',
    },
  ],
  invalid: [
    {
      code: "import { foo } from './foo';\nexport { foo } from './foo';",
      name: 'should report import declarations in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "export const value = 1;\nexport { helper } from './helper';",
      name: 'should report local declarations in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "export default foo;\nexport { helper } from './helper';",
      name: 'should report default exports in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "const foo = 1;\nexport { foo };\nexport { helper } from './helper';",
      name: 'should report local named export declarations without source in barrel files',
      filename: 'src/index.ts',
      errors: [
        { messageId: 'cleanBarrelOnlyReExports' },
        { messageId: 'cleanBarrelOnlyReExports' },
      ],
    },
    {
      code: "'use strict';\nexport { helper } from './helper';",
      name: 'should report directive statements in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "function helper() {}\nexport { value } from './value';",
      name: 'should report function declarations in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "class Helper {}\nexport { value } from './value';",
      name: 'should report class declarations in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "interface Helper {}\nexport { value } from './value';",
      name: 'should report interface declarations in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "enum Kind { A }\nexport { value } from './value';",
      name: 'should report enum declarations in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "namespace Helper {}\nexport { value } from './value';",
      name: 'should report namespace declarations in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'cleanBarrelOnlyReExports' }],
    },
    {
      code: "import packageJson from '../package.json';\nexport = packageJson;\nexport { value } from './value';",
      name: 'should report import and export assignment statements in barrel files once a module re-export exists',
      filename: 'src/index.ts',
      errors: [
        { messageId: 'cleanBarrelOnlyReExports' },
        { messageId: 'cleanBarrelOnlyReExports' },
      ],
    },
  ],
});
