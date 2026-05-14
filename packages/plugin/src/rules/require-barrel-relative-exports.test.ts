import path from 'node:path';
import { ruleTester } from '../testing/test-helper';
import { requireBarrelRelativeExports } from './require-barrel-relative-exports';

ruleTester.run('require-barrel-relative-exports', requireBarrelRelativeExports, {
  valid: [
    {
      code: "export { foo } from '../parent';",
      name: 'should ignore non-barrel files',
      filename: 'src/feature.ts',
    },
    {
      code: "export { foo } from './foo';",
      name: 'should allow named re-exports from same-directory descendants in barrel files',
      filename: 'src/index.ts',
    },
    {
      code: "export * from './feature/utils';",
      name: 'should allow wildcard re-exports from nested descendants in barrel files',
      filename: 'src/index.ts',
    },
    {
      code: "export type { Foo } from './types/foo';",
      name: 'should allow type-only re-exports from nested descendants in barrel files',
      filename: 'src/index.ts',
    },
    {
      code: "export * as utils from './utils';",
      name: 'should allow namespace re-exports from descendants in barrel files',
      filename: 'src/index.ts',
    },
    {
      code: 'const foo = 1;\nexport { foo };',
      name: 'should ignore local export declarations with no source',
      filename: 'src/index.ts',
    },
    {
      code: "export { foo } from './foo';",
      name: 'should allow single-extension JavaScript barrel files',
      filename: 'src/index.js',
    },
    {
      code: "export { foo } from '../parent';",
      name: 'should ignore double-extension index files',
      filename: 'src/index.test.ts',
    },
  ],
  invalid: [
    {
      code: "export { foo } from '../parent';",
      name: 'should report parent re-exports in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export * from '..';",
      name: 'should report bare parent re-exports in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export { foo } from 'package-name';",
      name: 'should report package re-exports in barrel files',
      filename: 'src/index.ts',
      output: null,
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export { noInlineTypeImport } from 'no-inline-type-import';",
      name: 'should fix verified bare same-directory re-exports in barrel files',
      filename: path.resolve('src', 'rules', 'index.ts'),
      output: "export { noInlineTypeImport } from './no-inline-type-import';",
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export type { Foo } from '@/types';",
      name: 'should report aliased re-exports in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export * as rootValue from '/root/value';",
      name: 'should report absolute re-exports in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export * from './';",
      name: 'should report bare current-directory re-exports in barrel files',
      filename: 'src/index.ts',
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export { foo } from './../foo';",
      name: 'should report current-directory re-exports that traverse to a parent directory',
      filename: 'src/index.ts',
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
    {
      code: "export * from './..';",
      name: 'should report current-directory re-exports that target the parent directory',
      filename: 'src/index.ts',
      errors: [{ messageId: 'relativeBarrelExport' }],
    },
  ],
});
