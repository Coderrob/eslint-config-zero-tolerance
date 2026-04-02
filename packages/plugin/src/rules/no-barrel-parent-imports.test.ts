import { ruleTester } from '../testing/test-helper';
import { noBarrelParentImports } from './no-barrel-parent-imports';

ruleTester.run('no-barrel-parent-imports', noBarrelParentImports, {
  valid: [
    {
      name: 'should allow external package imports',
      code: "import react from 'react';",
    },
    {
      name: 'should allow project-rooted alias imports',
      code: "import appConfig from '@/config/app';",
    },
    {
      name: 'should allow peer relative imports',
      code: "import sibling from './sibling';",
    },
    {
      name: 'should allow index imports from current directory',
      code: "import './index';",
    },
    {
      name: 'should allow dynamic imports from non-parent paths',
      code: "const feature = await import('./feature');",
    },
    {
      name: 'should allow dynamic import expressions with non-literal source',
      code: 'const feature = await import(moduleName);',
    },
    {
      name: 'should allow dynamic import expressions with non-string literal source',
      code: 'const feature = await import(123);',
    },
    {
      name: 'should allow require from non-parent paths',
      code: "const feature = require('./feature');",
    },
    {
      name: 'should allow member require calls even when the argument is a parent path',
      code: "const feature = loader.require('../feature');",
    },
    {
      name: 'should allow member require calls in barrel files even when the argument is a parent path',
      filename: '/src/index.ts',
      code: "const feature = loader.require('../feature');",
    },
    {
      name: 'should allow require with no arguments',
      code: 'const feature = require();',
    },
    {
      name: 'should allow require with no arguments in barrel files',
      filename: '/src/index.ts',
      code: 'const feature = require();',
    },
    {
      name: 'should allow require with non-string literal argument',
      code: 'const feature = require(123);',
    },
    {
      name: 'should allow require with non-string literal argument in barrel files',
      filename: '/src/index.ts',
      code: 'const feature = require(123);',
    },
    {
      name: 'should allow non-require call expression even with parent-like path',
      code: "const parent = loader('../parent');",
    },
    {
      name: 'should allow import-equals from non-parent paths',
      code: "import feature = require('./feature');",
    },
    {
      name: 'should allow import-equals with internal module reference',
      code: 'import Alias = Namespace.Value;',
    },
    {
      name: 'should allow import-equals with internal module reference in barrel files',
      filename: '/src/index.ts',
      code: 'import Alias = Namespace.Value;',
    },
    {
      name: 'should allow parent directory import declarations in non-barrel files',
      filename: '/src/feature.ts',
      code: "import parent from '../parent';",
    },
    {
      name: 'should allow dynamic parent imports in non-barrel files',
      filename: '/src/feature.ts',
      code: "const parent = await import('../parent');",
    },
    {
      name: 'should allow require calls from parent paths in non-barrel files',
      filename: '/src/feature.ts',
      code: "const parent = require('../parent');",
    },
    {
      name: 'should allow import-equals from parent paths in non-barrel files',
      filename: '/src/feature.ts',
      code: "import parent = require('../parent');",
    },
    {
      name: 'should allow parent directory import declarations in double-extension index-like files',
      filename: '/src/index.test.ts',
      code: "import parent from '../parent';",
    },
  ],
  invalid: [
    {
      name: 'should disallow parent directory import declarations in barrel files',
      filename: '/src/index.ts',
      code: "import parent from '../parent';",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow bare parent import declarations in barrel files',
      filename: '/src/index.ts',
      code: "import '..';",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow type-only parent import declarations in barrel files',
      filename: '/src/index.ts',
      code: "import type { ParentType } from '../types';",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow dynamic parent imports in barrel files',
      filename: '/src/index.ts',
      code: "const parent = await import('../parent');",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow require calls from parent paths in barrel files',
      filename: '/src/index.ts',
      code: "const parent = require('../parent');",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow import-equals from parent paths in barrel files',
      filename: '/src/index.ts',
      code: "import parent = require('../parent');",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow import-equals from bare parent path in barrel files',
      filename: '/src/index.ts',
      code: "import parent = require('..');",
      errors: [{ messageId: 'noParentImport' }],
    },
  ],
});
