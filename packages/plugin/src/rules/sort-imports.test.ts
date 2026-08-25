import { ruleTester } from '../testing/test-helper';
import { sortImports } from './sort-imports';

describe('sort-imports', () => {
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
        name: 'should allow bare parent import path',
        code: "import parent from '..';\nimport sibling from './sibling';",
      },
      {
        name: 'should allow ./index as an index import after peer imports',
        code: "import auth from './auth';\nimport self from './index';",
      },
      {
        name: 'should allow side-effect import before external import',
        code: "import 'reflect-metadata';\nimport { injectable } from 'inversify';",
      },
      {
        name: 'should allow multiple side-effect imports in alphabetical order before external imports',
        code: "import 'polyfill';\nimport 'reflect-metadata';\nimport express from 'express';",
      },
      {
        name: 'should allow side-effect imports followed by all groups in correct order',
        code: [
          "import 'reflect-metadata';",
          "import express from 'express';",
          "import path from 'path';",
          "import models from '../models';",
          "import auth from './auth';",
          "import self from '.';",
        ].join('\n'),
      },
      {
        name: 'should allow multiple side-effect imports alphabetically sorted',
        code: "import 'a-polyfill';\nimport 'b-setup';",
      },
      {
        name: 'should preserve side-effect import order because evaluation order can be significant',
        code: "import 'z-initialize';\nimport 'a-register';",
      },
      {
        name: 'should allow builtin import after side-effect and before external import',
        code: "import 'reflect-metadata';\nimport { dirname } from 'node:path';\nimport { injectable } from 'inversify';",
      },
      {
        name: 'should allow multiple builtin imports in alphabetical order',
        code: "import { readFile } from 'node:fs';\nimport { dirname } from 'node:path';",
      },
      {
        name: 'should allow builtin imports followed by parent imports',
        code: "import { dirname } from 'node:path';\nimport utils from '../utils';",
      },
      {
        name: 'should allow side-effect, builtin, external, and parent imports in correct order with type imports',
        code: [
          "import 'reflect-metadata';",
          '',
          "import { dirname } from 'node:path';",
          '',
          "import { inject, injectable } from 'inversify';",
          '',
          "import type { IWorkflowReader } from '../interfaces/parsing/IWorkflowReader';",
          "import type { ISchemaValidator } from '../interfaces/schema/ISchemaValidator';",
          "import type { IEventValidator } from '../interfaces/validation/IEventValidator';",
        ].join('\n'),
      },
    ],
    invalid: [
      {
        name: 'should report two external imports out of alphabetical order',
        code: "import b from 'b';\nimport a from 'a';",
        output: "import a from 'a';\nimport b from 'b';",
        errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'b' } }],
      },
      {
        name: 'should report third external import out of alphabetical order',
        code: "import a from 'a';\nimport c from 'c';\nimport b from 'b';",
        output: "import a from 'a';\nimport b from 'b';\nimport c from 'c';",
        errors: [{ messageId: 'unsortedImport', data: { current: 'b', previous: 'c' } }],
      },
      {
        name: 'should report when first external import is not the smallest',
        code: "import z from 'z';\nimport a from 'a';",
        output: "import a from 'a';\nimport z from 'z';",
        errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'z' } }],
      },
      {
        name: 'should report multiple external imports out of alphabetical order',
        code: "import c from 'c';\nimport a from 'a';\nimport b from 'b';",
        output: "import a from 'a';\nimport b from 'b';\nimport c from 'c';",
        errors: [{ messageId: 'unsortedImport', data: { current: 'a', previous: 'c' } }],
      },
      {
        name: 'should sort a large reversed import run in one pass',
        code: [
          "import zeta from 'zeta';",
          "import epsilon from 'epsilon';",
          "import delta from 'delta';",
          "import beta from 'beta';",
          "import alpha from 'alpha';",
        ].join('\n'),
        output: [
          "import alpha from 'alpha';",
          "import beta from 'beta';",
          "import delta from 'delta';",
          "import epsilon from 'epsilon';",
          "import zeta from 'zeta';",
        ].join('\n'),
        errors: [
          { messageId: 'unsortedImport', data: { current: 'epsilon', previous: 'zeta' } },
          { messageId: 'unsortedImport', data: { current: 'delta', previous: 'epsilon' } },
          { messageId: 'unsortedImport', data: { current: 'beta', previous: 'delta' } },
          { messageId: 'unsortedImport', data: { current: 'alpha', previous: 'beta' } },
        ],
      },
      {
        name: 'should report case-insensitive alphabetical violation within external group',
        code: "import b from 'Beta';\nimport a from 'alpha';",
        output: "import a from 'alpha';\nimport b from 'Beta';",
        errors: [{ messageId: 'unsortedImport', data: { current: 'alpha', previous: 'Beta' } }],
      },
      {
        name: 'should report parent import placed before external import',
        code: "import utils from '../utils';\nimport express from 'express';",
        output: "import express from 'express';\nimport utils from '../utils';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: '../utils',
              next: 'express',
              currentGroup: 'parent',
              nextGroup: 'external',
            },
          },
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
        output: "import express from 'express';\nimport auth from './auth';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: './auth',
              next: 'express',
              currentGroup: 'peer',
              nextGroup: 'external',
            },
          },
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
        output: "import express from 'express';\nimport self from '.';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: '.',
              next: 'express',
              currentGroup: 'index',
              nextGroup: 'external',
            },
          },
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
        output: "import utils from '../utils';\nimport auth from './auth';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: './auth',
              next: '../utils',
              currentGroup: 'peer',
              nextGroup: 'parent',
            },
          },
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
        name: 'should report interleaved groups holistically',
        code: [
          "import alpha from 'alpha';",
          "import utils from '../utils';",
          "import beta from 'beta';",
          "import auth from './auth';",
        ].join('\n'),
        output:
          "import alpha from 'alpha';\nimport beta from 'beta';\nimport utils from '../utils';\nimport auth from './auth';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: '../utils',
              next: 'beta',
              currentGroup: 'parent',
              nextGroup: 'external',
            },
          },
          {
            messageId: 'wrongGroup',
            data: {
              current: 'beta',
              previous: '../utils',
              currentGroup: 'external',
              previousGroup: 'parent',
            },
          },
        ],
      },
      {
        name: 'should report index import placed before parent import',
        code: "import self from '.';\nimport utils from '../utils';",
        output: "import utils from '../utils';\nimport self from '.';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: '.',
              next: '../utils',
              currentGroup: 'index',
              nextGroup: 'parent',
            },
          },
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
        output: "import auth from './auth';\nimport self from '.';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: '.',
              next: './auth',
              currentGroup: 'index',
              nextGroup: 'peer',
            },
          },
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
        output: "import auth from './auth';\nimport users from './users';",
        errors: [{ messageId: 'unsortedImport', data: { current: './auth', previous: './users' } }],
      },
      {
        name: 'should report parent imports out of alphabetical order',
        code: "import utils from '../utils';\nimport models from '../models';",
        output: "import models from '../models';\nimport utils from '../utils';",
        errors: [
          {
            messageId: 'unsortedImport',
            data: { current: '../models', previous: '../utils' },
          },
        ],
      },
      {
        name: 'should sort a non-adjacent wrongGroup violation in one pass',
        code: [
          "import auth from './auth';",
          "import express from 'express';",
          "import path from 'path';",
        ].join('\n'),
        output:
          "import express from 'express';\nimport path from 'path';\nimport auth from './auth';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: './auth',
              next: 'express',
              currentGroup: 'peer',
              nextGroup: 'external',
            },
          },
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
        name: 'should sort a non-adjacent wrongGroupAfter violation in one pass',
        code: [
          "import auth from './auth';",
          "import users from './users';",
          "import express from 'express';",
        ].join('\n'),
        output:
          "import express from 'express';\nimport auth from './auth';\nimport users from './users';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: './users',
              next: 'express',
              currentGroup: 'peer',
              nextGroup: 'external',
            },
          },
          {
            messageId: 'wrongGroup',
            data: {
              current: 'express',
              previous: './users',
              currentGroup: 'external',
              previousGroup: 'peer',
            },
          },
        ],
      },
      {
        name: 'should report external import placed before side-effect import',
        code: "import { injectable } from 'inversify';\nimport 'reflect-metadata';",
        output: null,
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: 'inversify',
              next: 'reflect-metadata',
              currentGroup: 'external',
              nextGroup: 'side-effect',
            },
          },
          {
            messageId: 'wrongGroup',
            data: {
              current: 'reflect-metadata',
              previous: 'inversify',
              currentGroup: 'side-effect',
              previousGroup: 'external',
            },
          },
        ],
      },
      {
        name: 'should preserve stable ordering between multiple side-effect imports during analysis',
        code: "import value from 'alpha';\nimport 'setup-z';\nimport 'setup-a';",
        output: null,
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: 'alpha',
              currentGroup: 'external',
              next: 'setup-z',
              nextGroup: 'side-effect',
            },
          },
          {
            messageId: 'wrongGroup',
            data: {
              current: 'setup-z',
              currentGroup: 'side-effect',
              previous: 'alpha',
              previousGroup: 'external',
            },
          },
        ],
      },
      {
        name: 'should report external import placed before builtin import',
        code: "import express from 'express';\nimport { dirname } from 'node:path';",
        output: "import { dirname } from 'node:path';\nimport express from 'express';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: 'express',
              next: 'node:path',
              currentGroup: 'external',
              nextGroup: 'builtin',
            },
          },
          {
            messageId: 'wrongGroup',
            data: {
              current: 'node:path',
              previous: 'express',
              currentGroup: 'builtin',
              previousGroup: 'external',
            },
          },
        ],
      },
      {
        name: 'should report builtin imports out of alphabetical order',
        code: "import { dirname } from 'node:path';\nimport { readFile } from 'node:fs';",
        output: "import { readFile } from 'node:fs';\nimport { dirname } from 'node:path';",
        errors: [
          {
            messageId: 'unsortedImport',
            data: { current: 'node:fs', previous: 'node:path' },
          },
        ],
      },
      {
        name: 'should report non-side-effect import placed between side-effect imports and external imports',
        code: [
          "import 'reflect-metadata';",
          "import auth from './auth';",
          "import express from 'express';",
        ].join('\n'),
        output:
          "import 'reflect-metadata';\nimport express from 'express';\nimport auth from './auth';",
        errors: [
          {
            messageId: 'wrongGroupAfter',
            data: {
              current: './auth',
              next: 'express',
              currentGroup: 'peer',
              nextGroup: 'external',
            },
          },
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
        name: 'should report without fixing when a comment occurs between imports',
        code: "import zeta from 'zeta';\n// alpha registration\nimport alpha from 'alpha';",
        output: null,
        errors: [{ messageId: 'unsortedImport', data: { current: 'alpha', previous: 'zeta' } }],
      },
      {
        name: 'should report without fixing when executable code occurs between imports',
        code: "import zeta from 'zeta';\ninitialize();\nimport alpha from 'alpha';",
        output: null,
        errors: [{ messageId: 'unsortedImport', data: { current: 'alpha', previous: 'zeta' } }],
      },
    ],
  });
});
