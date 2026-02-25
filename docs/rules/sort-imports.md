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
// External packages sorted alphabetically
import express from 'express';
import path from 'path';

// Relative imports sorted alphabetically
import { auth } from './auth';
import { users } from './users';
```

### ❌ Incorrect

```typescript
// External packages out of order
import path from 'path';
import express from 'express';  // 'express' should come before 'path'

// Relative imports out of order
import { users } from './users';
import { auth } from './auth';  // './auth' should come before './users'
```

## Configuration

This rule has no options:

```js
'zero-tolerance/sort-imports': 'error'
```
