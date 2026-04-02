import { ruleTester } from '../testing/test-helper';
import { noReExport } from './no-re-export';

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
      code: "import { foo } from './child';\nexport { foo };",
      name: 'should allow pass-through export of a child import',
    },
    {
      code: "import { foo } from '../sibling';\nconst local = foo;\nexport { local };",
      name: 'should allow exporting a local binding derived from a parent import',
    },
    {
      code: "import parentDefault from '../parent';\nexport default wrap(parentDefault);",
      name: 'should allow default exports that do not directly pass through a parent import',
    },
    {
      code: "import parent = require('./sibling');\nexport { parent };",
      name: 'should allow pass-through export of a child import-equals binding',
    },
    {
      code: 'import Alias = Namespace.Value;\nexport { Alias };',
      name: 'should allow pass-through export of an internal import-equals binding',
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
    {
      code: "import { foo } from '../sibling';\nexport { foo };",
      name: 'should disallow pass-through named export of a parent import',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "import type { Foo } from '../sibling';\nexport type { Foo };",
      name: 'should disallow pass-through type export of a parent import',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "import * as siblingNs from '../sibling';\nexport { siblingNs };",
      name: 'should disallow pass-through namespace export of a parent import',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "import parentDefault from '../../parent';\nexport default parentDefault;",
      name: 'should disallow pass-through default export of a parent import',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "import parent = require('../sibling');\nexport { parent };",
      name: 'should disallow pass-through export of a parent import-equals binding',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "import parent = require('../../parent');\nexport = parent;",
      name: 'should disallow pass-through TypeScript export assignment of a parent import',
      errors: [{ messageId: 'noReExport' }],
    },
  ],
});
