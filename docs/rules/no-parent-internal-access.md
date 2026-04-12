# no-parent-internal-access

Disallow parent-relative access into protected internal directories such as `src`.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

Parent-relative paths like `../src/...` and `../../src/...` usually mean one module is reaching into another module's internal implementation instead of consuming its public entrypoint. That creates tight coupling, makes refactors harder, and breaks the expectation that protected directories such as `src`, `app`, or `internal` are self-contained boundaries.

This rule is opt-in and disabled by default in the built-in presets.

By default, the rule protects the `src` directory name. You can override that list with the `protectedDirectories` option.

Matching is intentionally narrow:

- only parent-relative paths are checked
- only the first concrete directory reached after `..` traversal is matched
- `protectedDirectories` entries are trimmed, deduplicated, and empty entries are ignored

This rule checks:

- `import ... from '...'`
- `import('...')`
- `require('...')`
- TypeScript `import x = require('...')`
- direct re-exports such as `export { x } from '...'` and `export * from '...'`

## Examples

### ✅ Correct

```typescript
import { feature } from '../shared/feature';
import localFeature from './src/local-feature';
export { childFeature } from './src/child-feature';
import { nestedFeature } from '../shared/src/feature';

import { parentValue } from '../parent';
const localValue = parentValue;
export { localValue };
```

### ❌ Incorrect

```typescript
import { feature } from '../src/feature';
const legacyFeature = require('../../src/legacy-feature');
const dynamicFeature = await import('../src/dynamic-feature');
import feature = require('../src/feature');

export { sharedFeature } from '../src/shared-feature';
export * from '../../src/shared-feature';
```

## Configuration

Default configuration:

```js
'zero-tolerance/no-parent-internal-access': 'error'
```

Custom protected directory names:

```js
'zero-tolerance/no-parent-internal-access': [
  'error',
  {
    protectedDirectories: ['src', 'app', 'internal'],
  },
]
```

This matches `../src/foo` and `../../app/foo`, but not `../shared/src/foo` because `shared` is the first traversed directory.
