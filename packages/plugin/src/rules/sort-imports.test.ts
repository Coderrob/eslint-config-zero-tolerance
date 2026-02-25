import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { sortImports } from './sort-imports';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('sort-imports', sortImports, {
  valid: [
    {
      name: 'single import',
      code: "import a from 'a';",
    },
    {
      name: 'two imports in alphabetical order',
      code: "import a from 'a';\nimport b from 'b';",
    },
    {
      name: 'multiple imports in alphabetical order',
      code: "import alpha from 'alpha';\nimport beta from 'beta';\nimport gamma from 'gamma';",
    },
    {
      name: 'no imports',
      code: 'const x = 1;',
    },
    {
      name: 'case-insensitive ordering respected',
      code: "import a from 'Alpha';\nimport b from 'beta';",
    },
  ],
  invalid: [
    {
      name: 'two imports out of order',
      code: "import b from 'b';\nimport a from 'a';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'b' } }],
    },
    {
      name: 'third import out of order',
      code: "import a from 'a';\nimport c from 'c';\nimport b from 'b';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'b', previous: 'c' } }],
    },
    {
      name: 'first import is not the smallest',
      code: "import z from 'z';\nimport a from 'a';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'z' } }],
    },
    {
      name: 'multiple imports out of order',
      code: "import c from 'c';\nimport a from 'a';\nimport b from 'b';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'c' } }],
    },
    {
      name: 'case-insensitive violation',
      code: "import b from 'Beta';\nimport a from 'alpha';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'alpha', previous: 'Beta' } }],
    },
  ],
} as any);
