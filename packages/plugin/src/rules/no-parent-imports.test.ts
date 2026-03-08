import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { noParentImports } from './no-parent-imports';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-parent-imports', noParentImports, {
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
      name: 'should allow require from non-parent paths',
      code: "const feature = require('./feature');",
    },
    {
      name: 'should allow require with no arguments',
      code: 'const feature = require();',
    },
    {
      name: 'should allow require with non-string literal argument',
      code: 'const feature = require(123);',
    },
    {
      name: 'should allow import-equals from non-parent paths',
      code: "import feature = require('./feature');",
    },
    {
      name: 'should allow import-equals with internal module reference',
      code: 'import Alias = Namespace.Value;',
    },
  ],
  invalid: [
    {
      name: 'should disallow parent directory import declarations',
      code: "import parent from '../parent';",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow bare parent import declarations',
      code: "import '..';",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow type-only parent import declarations',
      code: "import type { ParentType } from '../types';",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow dynamic parent imports',
      code: "const parent = await import('../parent');",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow require calls from parent paths',
      code: "const parent = require('../parent');",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow import-equals from parent paths',
      code: "import parent = require('../parent');",
      errors: [{ messageId: 'noParentImport' }],
    },
    {
      name: 'should disallow import-equals from bare parent path',
      code: "import parent = require('..');",
      errors: [{ messageId: 'noParentImport' }],
    },
  ],
});
