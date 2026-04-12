import { ruleTester } from '../testing/test-helper';
import { noRestrictedImportsInTests } from './no-restricted-imports-in-tests';

ruleTester.run('no-restricted-imports-in-tests', noRestrictedImportsInTests, {
  valid: [
    {
      name: 'should allow restricted imports outside test files',
      code: "import fs from 'node:fs';",
      filename: 'src/file.ts',
    },
    {
      name: 'should allow unrestricted imports in test files',
      code: "import { render } from '@testing-library/react';",
      filename: 'src/file.test.ts',
    },
    {
      name: 'should allow relative imports in test files',
      code: "import { createFixture } from './fixtures';",
      filename: 'src/file.test.ts',
    },
    {
      name: 'should allow dynamic imports with non-literal sources in test files',
      code: 'const module = await import(moduleName);',
      filename: 'src/file.test.ts',
    },
    {
      name: 'should allow member require calls in test files',
      code: "const fs = loader.require('fs');",
      filename: 'src/file.test.ts',
    },
    {
      name: 'should allow require calls with non-literal sources in test files',
      code: 'const module = require(moduleName);',
      filename: 'src/file.test.ts',
    },
    {
      name: 'should allow import-equals internal module references in test files',
      code: 'import Alias = Namespace.Value;',
      filename: 'src/file.test.ts',
    },
    {
      name: 'should allow modules not included in custom restriction options',
      code: "import fs from 'fs';",
      filename: 'src/file.test.ts',
      options: [{ modules: ['http'] }],
    },
  ],
  invalid: [
    {
      name: 'should disallow fs imports in test files',
      code: "import fs from 'fs';",
      filename: 'src/file.test.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow fs subpath imports in test files',
      code: "import { readFile } from 'fs/promises';",
      filename: 'src/file.test.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow node fs subpath imports in test files',
      code: "import { readFile } from 'node:fs/promises';",
      filename: 'src/file.spec.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow child process imports in test files',
      code: "import { execFile } from 'node:child_process';",
      filename: 'src/__tests__/process.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow axios imports in test files',
      code: "import axios from 'axios';",
      filename: 'src/http.test.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow http require calls in test files',
      code: "const http = require('http');",
      filename: 'src/http.test.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow dynamic net imports in test files',
      code: "const net = await import('node:net');",
      filename: 'src/net.integration.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow import-equals for node fs in test files',
      code: "import fs = require('node:fs');",
      filename: 'src/file.test.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow direct re-export from restricted modules in test files',
      code: "export { request } from 'http';",
      filename: 'src/file.test.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow wildcard re-export from restricted modules in test files',
      code: "export * from 'node:worker_threads';",
      filename: 'src/file.test.ts',
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
    {
      name: 'should disallow custom configured restricted modules in test files',
      code: "import database from '@company/database';",
      filename: 'src/file.test.ts',
      options: [{ modules: ['@company/database', '  node:fs/*  ', ''] }],
      errors: [{ messageId: 'noRestrictedImportsInTests' }],
    },
  ],
});
