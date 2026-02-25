# sort-imports

Require import declarations to be sorted alphabetically by module path.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

Alphabetically sorted imports eliminate merge conflicts caused by two developers adding imports to the same file, make it easy to spot duplicates, and provide a predictable place to look for any given import. Sorting is case-insensitive.

## Examples

### ✅ Correct

```typescript
import fs from 'fs';
import path from 'path';
import { foo } from './foo';
import { bar } from './utils/bar';
```

### ❌ Incorrect

```typescript
import { bar } from './utils/bar';
import fs from 'fs';         // 'fs' should come before './utils/bar'
import { foo } from './foo';
import path from 'path';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/sort-imports': 'error'
```
