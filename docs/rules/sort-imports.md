# sort-imports

Require import declarations to be grouped and sorted: side-effect → external → parent → peer → index, with alphabetical ordering within each group.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Consistent import ordering reduces merge conflicts and makes it immediately clear where a dependency comes from. Imports must appear in five groups in order — side-effect (bare) imports, external packages, parent-directory (`../`) imports, peer (`./`) imports, and the index (`.`) import — with each group sorted alphabetically (case-insensitive).

Side-effect imports (`import 'module'`) have no specifiers and often set up runtime prerequisites such as polyfills or reflection metadata. They must appear before all other imports.

## Examples

### ✅ Correct

```typescript
// 1. Side-effect imports — alphabetical
import 'reflect-metadata';

// 2. External packages — alphabetical
import express from 'express';
import { injectable } from 'inversify';
import path from 'path';

// 3. Parent imports — alphabetical
import { models } from '../models';
import { utils } from '../utils';

// 4. Peer imports — alphabetical
import { auth } from './auth';
import { users } from './users';

// 5. Index import
import self from '.';
```

### ❌ Incorrect

```typescript
// External import placed before side-effect import — wrong group order
import { injectable } from 'inversify';
import 'reflect-metadata';

// Peer import placed before external — wrong group order
import { auth } from './auth';
import express from 'express';

// Parent import placed before external — wrong group order
import { utils } from '../utils';
import lodash from 'lodash';

// External packages out of alphabetical order
import zlib from 'zlib';
import axios from 'axios'; // 'axios' should come before 'zlib'
```

## Configuration

This rule has no options:

```js
'zero-tolerance/sort-imports': 'error'
```
