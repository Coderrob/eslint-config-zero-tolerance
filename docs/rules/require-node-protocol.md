# require-node-protocol

Require Node.js built-in module imports to use the `node:` protocol prefix.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Starting with Node.js 16, built-in modules can be imported using the `node:` protocol prefix (e.g., `node:fs` instead of `fs`). Using the protocol prefix makes it immediately clear that the import refers to a Node.js built-in module rather than a user-land package with the same name, improving readability and preventing potential name collisions.

## Examples

### ✅ Correct

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import { createServer } from 'node:http';
```

### ❌ Incorrect

```typescript
import fs from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';
import os from 'os';
import { createServer } from 'http';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-node-protocol': 'error'
```
