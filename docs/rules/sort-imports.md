# sort-imports

Require import declarations to be grouped and sorted: external → parent → peer → index, with alphabetical ordering within each group.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Consistent import ordering reduces merge conflicts and makes it immediately clear where a dependency comes from. Imports must appear in four groups in order — external packages, parent-directory (`../`) imports, peer (`./`) imports, and the index (`.`) import — with each group sorted alphabetically (case-insensitive).

## Examples

### ✅ Correct

```typescript
// 1. External packages — alphabetical
import express from 'express';
import path from 'path';

// 2. Parent imports — alphabetical
import { models } from '../models';
import { utils } from '../utils';

// 3. Peer imports — alphabetical
import { auth } from './auth';
import { users } from './users';

// 4. Index import
import self from '.';
```

### ❌ Incorrect

```typescript
// Peer import placed before external — wrong group order
import { auth } from './auth';
import express from 'express';

// Parent import placed before external — wrong group order
import { utils } from '../utils';
import path from 'path';

// External packages out of alphabetical order
import path from 'path';
import express from 'express'; // 'express' should come before 'path'
```

## Configuration

This rule has no options:

```js
'zero-tolerance/sort-imports': 'error'
```
