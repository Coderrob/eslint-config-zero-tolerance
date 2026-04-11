import { ruleTester } from '../testing/test-helper';
import { requireNodeProtocol } from './require-node-protocol';

ruleTester.run('require-node-protocol', requireNodeProtocol, {
  valid: [
    {
      code: "import fs from 'node:fs';",
      name: 'should allow import with node: protocol prefix',
    },
    {
      code: "import path from 'node:path';",
      name: 'should allow path import with node: protocol prefix',
    },
    {
      code: "import os from 'node:os';",
      name: 'should allow os import with node: protocol prefix',
    },
    {
      code: "import { readFile } from 'node:fs/promises';",
      name: 'should allow subpath import with node: protocol prefix',
    },
    {
      code: "import express from 'express';",
      name: 'should allow non-builtin module import without node: prefix',
    },
    {
      code: "import lodash from 'lodash';",
      name: 'should allow third-party module import',
    },
    {
      code: "import foo from './foo';",
      name: 'should allow relative import',
    },
    {
      code: "import type { Stats } from 'node:fs';",
      name: 'should allow type-only import with node: protocol prefix',
    },
    {
      code: "export { foo } from './bar';",
      name: 'should allow re-export from relative path',
    },
    {
      code: 'const foo = 1; export { foo };',
      name: 'should allow named export without source',
    },
    {
      code: "export * from 'node:fs';",
      name: 'should allow wildcard re-export with node: protocol prefix',
    },
  ],
  invalid: [
    {
      code: "import fs from 'fs';",
      name: 'should report fs import without node: prefix',
      output: "import fs from 'node:fs';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'fs' },
        },
      ],
    },
    {
      code: "import os from 'os';",
      name: 'should report os import without node: prefix',
      output: "import os from 'node:os';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'os' },
        },
      ],
    },
    {
      code: "import path from 'path';",
      name: 'should report path import without node: prefix',
      output: "import path from 'node:path';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'path' },
        },
      ],
    },
    {
      code: "import { readFile } from 'fs/promises';",
      name: 'should report subpath import without node: prefix',
      output: "import { readFile } from 'node:fs/promises';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'fs/promises' },
        },
      ],
    },
    {
      code: "import http from 'http';",
      name: 'should report http import without node: prefix',
      output: "import http from 'node:http';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'http' },
        },
      ],
    },
    {
      code: "import { createServer } from 'https';",
      name: 'should report named import of builtin without node: prefix',
      output: "import { createServer } from 'node:https';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'https' },
        },
      ],
    },
    {
      code: "import * as crypto from 'crypto';",
      name: 'should report namespace import of builtin without node: prefix',
      output: "import * as crypto from 'node:crypto';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'crypto' },
        },
      ],
    },
    {
      code: "import type { Stats } from 'fs';",
      name: 'should report type-only import of builtin without node: prefix',
      output: "import type { Stats } from 'node:fs';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'fs' },
        },
      ],
    },
    {
      code: "export { foo } from 'path';",
      name: 'should report re-export from builtin without node: prefix',
      output: "export { foo } from 'node:path';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'path' },
        },
      ],
    },
    {
      code: "export * from 'events';",
      name: 'should report wildcard re-export from builtin without node: prefix',
      output: "export * from 'node:events';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'events' },
        },
      ],
    },
    {
      code: 'import child from "child_process";',
      name: 'should report builtin import using double quotes and preserve quote style',
      output: 'import child from "node:child_process";',
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'child_process' },
        },
      ],
    },
    {
      code: "import { setTimeout } from 'timers/promises';",
      name: 'should report timers/promises subpath import without node: prefix',
      output: "import { setTimeout } from 'node:timers/promises';",
      errors: [
        {
          messageId: 'requireNodeProtocol',
          data: { module: 'timers/promises' },
        },
      ],
    },
  ],
});
