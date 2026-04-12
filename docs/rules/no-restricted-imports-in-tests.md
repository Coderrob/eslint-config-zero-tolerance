# no-restricted-imports-in-tests

Disallow configured dependency imports in test files.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

Tests should make expensive boundaries explicit. Directly importing filesystem, process, and network modules inside test files often leads to tests that depend on local machine state, real sockets, subprocesses, or external services. This rule is opt-in so projects can adopt it where those boundaries matter most.

By default, the rule restricts these module roots in test files:

```text
axios, child_process, dgram, dns, fs, got, http, http2, https, net, node-fetch, tls, undici, worker_threads
```

The `node:` protocol is normalized before matching, so `node:fs`, `node:fs/promises`, and `fs/promises` all match the `fs` root. Entries ending in `/*` are also normalized, so configured values such as `fs/*` and `node:fs/*` protect the same root.

This rule checks:

- `import ... from '...'`
- `import('...')`
- `require('...')`
- TypeScript `import x = require('...')`
- direct re-exports such as `export { x } from '...'` and `export * from '...'`

It only runs in recognized test files: `*.test.*`, `*.spec.*`, `*.e2e.*`, `*.integration.*`, and files under `__tests__/`.

## Examples

### ✅ Correct

```typescript
import { createFixture } from './fixtures';
import { render } from '@testing-library/react';

const client = createMockClient();
const result = await runScenario(client);
```

### ❌ Incorrect

```typescript
import fs from 'fs';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import axios from 'axios';

const http = require('http');
const net = await import('node:net');
import workerThreads = require('node:worker_threads');
```

## Configuration

Default configuration:

```js
'zero-tolerance/no-restricted-imports-in-tests': 'error'
```

Custom restricted module roots:

```js
'zero-tolerance/no-restricted-imports-in-tests': [
  'error',
  {
    modules: ['fs', 'node:fs/*', 'child_process', 'axios', '@company/database'],
  },
]
```

Configured module names are trimmed, lowercased, normalized by removing `node:`, and matched by module root. For example, `fs` matches `fs`, `fs/promises`, `node:fs`, and `node:fs/promises`.
