# no-barrel-parent-imports

Disallow parent-directory traversal inside barrel files.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Barrel files (`index.*`) should aggregate exports from their own directory. Parent-directory imports (`..` and `../*`) inside those files create upward coupling, blur package boundaries, and make the barrel harder to reason about.

This rule is enabled by default in plugin presets: `warn` in `recommended` and `error` in `strict`.

This rule applies only when the current file is a barrel file (`index.*`). In those files, it checks:

- `import ... from '...'`
- `import('...')`
- `require('...')`
- TypeScript `import x = require('...')`

## Notes

- The rule applies only to single-extension barrel files such as `index.ts`, `index.js`, and `index.mts`.
- Double-extension files such as `index.d.ts`, `index.test.ts`, and `index.spec.js` are ignored.

## Examples

### Correct

```typescript
// feature.ts
import React from 'react';
import { parseUser } from '../parse-user';
const helpers = await import('../helpers');
const feature = require('../feature');
import legacyFeature = require('../legacy-feature');

// index.ts
export { parseUser } from './parse-user';
export { helpers } from './helpers';
```

### Incorrect

```typescript
// index.ts
import { parseUser } from '../parse-user';
import '..';

const helpers = await import('../helpers');
const feature = require('../../feature');
import legacyFeature = require('..');
```
