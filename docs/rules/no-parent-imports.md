# no-parent-imports

Disallow parent-directory traversal in all import patterns.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

Parent-directory imports (`..` and `../*`) create tight coupling to folder layout and make modules harder to move safely. Enforcing project-rooted, package, or same-directory imports keeps boundaries explicit and prevents upward traversal through the tree.

This rule is enabled by default in plugin presets: `warn` in `recommended` and `error` in `strict`.

This rule applies to all import patterns:

- `import ... from '...'`
- `import('...')`
- `require('...')`
- TypeScript `import x = require('...')`

## Examples

### ✅ Correct

```typescript
import React from 'react';
import { logger } from '@/shared/logger';
import { parseUser } from './parse-user';

const helpers = await import('./helpers');
const feature = require('./feature');
import legacyFeature = require('./legacy-feature');
```

### ❌ Incorrect

```typescript
import { parseUser } from '../parse-user';
import '..';

const helpers = await import('../helpers');
const feature = require('../../feature');
import legacyFeature = require('..');
```
