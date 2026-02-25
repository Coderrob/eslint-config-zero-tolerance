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
      name: 'should allow a single import',
      code: "import a from 'a';",
    },
    {
      name: 'should allow two external imports in alphabetical order',
      code: "import a from 'a';\nimport b from 'b';",
    },
    {
      name: 'should allow multiple external imports in alphabetical order',
      code: "import alpha from 'alpha';\nimport beta from 'beta';\nimport gamma from 'gamma';",
    },
    {
      name: 'should allow no imports',
      code: 'const x = 1;',
    },
    {
      name: 'should allow case-insensitive alphabetical ordering within external group',
      code: "import a from 'Alpha';\nimport b from 'beta';",
    },
    {
      name: 'should allow external imports followed by parent imports',
      code: "import express from 'express';\nimport utils from '../utils';",
    },
    {
      name: 'should allow external imports followed by peer imports',
      code: "import express from 'express';\nimport auth from './auth';",
    },
    {
      name: 'should allow external imports followed by index import',
      code: "import express from 'express';\nimport self from '.';",
    },
    {
      name: 'should allow parent imports followed by peer imports',
      code: "import models from '../models';\nimport auth from './auth';",
    },
    {
      name: 'should allow parent imports followed by index import',
      code: "import models from '../models';\nimport self from '.';",
    },
    {
      name: 'should allow peer imports followed by index import',
      code: "import auth from './auth';\nimport self from '.';",
    },
    {
      name: 'should allow all four groups in correct order',
      code: [
        "import express from 'express';",
        "import path from 'path';",
        "import models from '../models';",
        "import utils from '../utils';",
        "import auth from './auth';",
        "import users from './users';",
        "import self from '.';",
      ].join('\n'),
    },
    {
      name: 'should allow peer imports alphabetically sorted',
      code: "import auth from './auth';\nimport users from './users';",
    },
    {
      name: 'should allow parent imports alphabetically sorted',
      code: "import models from '../models';\nimport utils from '../utils';",
    },
    {
      name: 'should allow ./index as an index import after peer imports',
      code: "import auth from './auth';\nimport self from './index';",
    },
  ],
  invalid: [
    {
      name: 'should report two external imports out of alphabetical order',
      code: "import b from 'b';\nimport a from 'a';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'b' } }],
    },
    {
      name: 'should report third external import out of alphabetical order',
      code: "import a from 'a';\nimport c from 'c';\nimport b from 'b';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'b', previous: 'c' } }],
    },
    {
      name: 'should report when first external import is not the smallest',
      code: "import z from 'z';\nimport a from 'a';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'z' } }],
    },
    {
      name: 'should report multiple external imports out of alphabetical order',
      code: "import c from 'c';\nimport a from 'a';\nimport b from 'b';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'c' } }],
    },
    {
      name: 'should report case-insensitive alphabetical violation within external group',
      code: "import b from 'Beta';\nimport a from 'alpha';",
      errors: [{ messageId: 'unsortedImport', data: { current: 'alpha', previous: 'Beta' } }],
    },
    {
      name: 'should report parent import placed before external import',
      code: "import utils from '../utils';\nimport express from 'express';",
      errors: [
        {
          messageId: 'wrongGroup',
          data: {
            current: 'express',
            previous: '../utils',
            currentGroup: 'external',
            previousGroup: 'parent',
          },
        },
      ],
    },
    {
      name: 'should report peer import placed before external import',
      code: "import auth from './auth';\nimport express from 'express';",
      errors: [
        {
          messageId: 'wrongGroup',
          data: {
            current: 'express',
            previous: './auth',
            currentGroup: 'external',
            previousGroup: 'peer',
          },
        },
      ],
    },
    {
      name: 'should report index import placed before external import',
      code: "import self from '.';\nimport express from 'express';",
      errors: [
        {
          messageId: 'wrongGroup',
          data: {
            current: 'express',
            previous: '.',
            currentGroup: 'external',
            previousGroup: 'index',
          },
        },
      ],
    },
    {
      name: 'should report peer import placed before parent import',
      code: "import auth from './auth';\nimport utils from '../utils';",
      errors: [
        {
          messageId: 'wrongGroup',
          data: {
            current: '../utils',
            previous: './auth',
            currentGroup: 'parent',
            previousGroup: 'peer',
          },
        },
      ],
    },
    {
      name: 'should report index import placed before parent import',
      code: "import self from '.';\nimport utils from '../utils';",
      errors: [
        {
          messageId: 'wrongGroup',
          data: {
            current: '../utils',
            previous: '.',
            currentGroup: 'parent',
            previousGroup: 'index',
          },
        },
      ],
    },
    {
      name: 'should report index import placed before peer import',
      code: "import self from '.';\nimport auth from './auth';",
      errors: [
        {
          messageId: 'wrongGroup',
          data: {
            current: './auth',
            previous: '.',
            currentGroup: 'peer',
            previousGroup: 'index',
          },
        },
      ],
    },
    {
      name: 'should report peer imports out of alphabetical order',
      code: "import users from './users';\nimport auth from './auth';",
      errors: [
        { messageId: 'unsortedImport', data: { current: './auth', previous: './users' } },
      ],
    },
    {
      name: 'should report parent imports out of alphabetical order',
      code: "import utils from '../utils';\nimport models from '../models';",
      errors: [
        {
          messageId: 'unsortedImport',
          data: { current: '../models', previous: '../utils' },
        },
      ],
    },
  ],
} as any);
