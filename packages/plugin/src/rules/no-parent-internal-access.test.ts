import { ruleTester } from '../testing/test-helper';
import { noParentInternalAccess } from './no-parent-internal-access';

ruleTester.run('no-parent-internal-access', noParentInternalAccess, {
  valid: [
    {
      name: 'should allow package imports',
      code: "import react from 'react';",
    },
    {
      name: 'should allow same-directory imports into a protected folder name',
      code: "import local from './src/local';",
    },
    {
      name: 'should allow parent imports into non-protected directories',
      code: "import shared from '../shared/module';",
    },
    {
      name: 'should allow parent imports when the protected directory name is not the first traversed segment',
      code: "import shared from '../shared/src/module';",
    },
    {
      name: 'should allow bare parent imports because no protected directory is targeted',
      code: "import parent from '..';",
    },
    {
      name: 'should allow dynamic parent imports into non-protected directories',
      code: "const feature = await import('../shared/feature');",
    },
    {
      name: 'should allow dynamic import expressions with non-literal source',
      code: 'const feature = await import(moduleName);',
    },
    {
      name: 'should allow require calls into non-protected directories',
      code: "const feature = require('../shared/feature');",
    },
    {
      name: 'should allow member require calls into protected directories',
      code: "const feature = loader.require('../src/feature');",
    },
    {
      name: 'should allow require with no arguments',
      code: 'const feature = require();',
    },
    {
      name: 'should allow import-equals with internal module references',
      code: 'import Alias = Namespace.Value;',
    },
    {
      name: 'should allow direct re-exports from child modules',
      code: "export { feature } from './src/feature';",
    },
    {
      name: 'should allow exporting a protected directory when configured directories do not include it',
      code: "export { feature } from '../src/feature';",
      options: [{ protectedDirectories: ['internal'] }],
    },
    {
      name: 'should allow custom protected directories when the imported directory is not protected',
      code: "import feature from '../shared/feature';",
      options: [{ protectedDirectories: ['internal', 'app'] }],
    },
  ],
  invalid: [
    {
      name: 'should disallow parent imports into src by default',
      code: "import feature from '../src/feature';",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow ancestor imports into src by default',
      code: "import feature from '../../src/feature';",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow parent imports into a bare src directory by default',
      code: "import feature from '../src';",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow dynamic imports into src by default',
      code: "const feature = await import('../src/feature');",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow require calls into src by default',
      code: "const feature = require('../src/feature');",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow import-equals into src by default',
      code: "import feature = require('../src/feature');",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow direct named re-exports into src by default',
      code: "export { feature } from '../src/feature';",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow direct wildcard re-exports into src by default',
      code: "export * from '../../src/feature';",
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow parent imports into custom protected directories',
      code: "import feature from '../internal/feature';",
      options: [{ protectedDirectories: ['internal', 'app'] }],
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should disallow direct re-exports into custom protected directories',
      code: "export { feature } from '../app/feature';",
      options: [{ protectedDirectories: ['internal', 'app'] }],
      errors: [{ messageId: 'protectedParentImport' }],
    },
    {
      name: 'should trim configured protected directories and ignore empty entries',
      code: "import feature from '../src/feature';",
      options: [{ protectedDirectories: ['  src  ', 'src', '   '] }],
      errors: [{ messageId: 'protectedParentImport' }],
    },
  ],
});
