import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noReExport } from './no-re-export';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-re-export', noReExport, {
  valid: [
    {
      code: 'export { foo };',
      name: 'direct named export without re-export',
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
      code: 'export default foo;',
      name: 'default export',
    },
    {
      code: 'export class MyClass {}',
      name: 'class export',
    },
    {
      code: "export { foo } from './child';",
      name: 're-export from child module',
    },
    {
      code: "export { foo } from './child/grandchild';",
      name: 're-export from nested child module',
    },
    {
      code: "export * from './child';",
      name: 'wildcard re-export from child module',
    },
  ],
  invalid: [
    {
      code: "export { foo } from '../sibling';",
      name: 're-export from peer module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export * from '../sibling';",
      name: 'wildcard re-export from peer module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export { foo } from '../../parent';",
      name: 're-export from parent module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export { foo, bar } from '../../../grandparent';",
      name: 're-export from grandparent module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export * from '../../parent';",
      name: 'wildcard re-export from parent module',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export * as ns from '../../../grandparent';",
      name: 'namespace re-export from grandparent module',
      errors: [{ messageId: 'noReExport' }],
    },
  ],
} as any);
