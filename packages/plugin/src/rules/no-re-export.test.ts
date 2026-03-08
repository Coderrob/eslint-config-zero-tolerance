import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { noReExport } from './no-re-export';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-re-export', noReExport, {
  valid: [
    {
      code: 'export { foo };',
      name: 'should allow direct named export without re-export',
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
      code: 'export default foo;',
      name: 'should allow default export',
    },
    {
      code: 'export class MyClass {}',
      name: 'should allow class export',
    },
    {
      code: "export { foo } from './child';",
      name: 'should allow re-export from child module',
    },
    {
      code: "export { foo } from './child/grandchild';",
      name: 'should allow re-export from nested child module',
    },
    {
      code: "export * from './child';",
      name: 'should allow wildcard re-export from child module',
    },
    {
      code: "export { foo } from '../sibling';",
      name: 'should allow any re-export in a barrel file (named)',
      filename: 'src/index.ts',
    },
    {
      code: "export * from '../../parent';",
      name: 'should allow any re-export in a barrel file (wildcard)',
      filename: 'src/index.ts',
    },
    {
      code: "export { foo } from '../sibling';",
      name: 'should allow any re-export in a barrel file with .js extension',
      filename: 'src/index.js',
    },
  ],
  invalid: [
    {
      code: "export { foo } from '../sibling';",
      name: 'should disallow re-export from peer module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export * from '../sibling';",
      name: 'should disallow wildcard re-export from peer module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export { foo } from '../../parent';",
      name: 'should disallow re-export from parent module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export { foo, bar } from '../../../grandparent';",
      name: 'should disallow re-export from grandparent module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export * from '../../parent';",
      name: 'should disallow wildcard re-export from parent module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export * as ns from '../../../grandparent';",
      name: 'should disallow namespace re-export from grandparent module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export { foo } from '..';",
      name: 'should disallow re-export from bare parent path',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export * from '..';",
      name: 'should disallow wildcard re-export from bare parent path',
      errors: [{ messageId: 'noReExport' }],
    },
  ],
});
