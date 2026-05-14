# no-process-env-outside-config

Disallow `process.env` reads outside configuration modules.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Scattered `process.env` reads create hidden dependencies and inconsistent configuration behavior. Read environment variables once in configuration modules, validate them there, and import typed config values elsewhere.

## Examples

### ✅ Correct

```typescript
// src/config.ts
export const mode = process.env.NODE_ENV ?? 'development';
```

```typescript
// src/app.ts
import { mode } from './config';
```

### ❌ Incorrect

```typescript
const mode = process.env.NODE_ENV;

const { NODE_ENV } = process.env;
```

## Configuration

This rule has no options. `process.env` is allowed in files under `/config/` and in filenames such as `config.ts`, `env.ts`, and `vite.config.ts`:

```js
'zero-tolerance/no-process-env-outside-config': 'error'
```
