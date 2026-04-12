# require-clean-barrel

Require barrel files (`index.*`) to contain only module re-export declarations.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Barrel files should stay focused on aggregation. Allowing imports, declarations, executable statements, or local exports inside `index.*` files mixes concerns and makes module boundaries harder to reason about.

When an `index.*` file contains at least one module re-export declaration, this rule treats it as a barrel and enforces module re-exports only, such as:

- `export { foo } from './foo'`
- `export * from './foo'`
- `export type { Foo } from './types'`

## Examples

### ✅ Correct

```typescript
export { createClient } from './create-client';
export { parseConfig } from './parse-config';
export type { ClientOptions } from './types';
```

### ❌ Incorrect

```typescript
import { createClient } from './create-client';
export { createClient } from './create-client';

export const version = '1.0.0';

const helper = () => {};
export { helper };
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-clean-barrel': 'error'
```

## Notes

- The rule applies only to single-extension barrel files such as `index.ts`, `index.js`, and `index.mts`.
- Double-extension files such as `index.d.ts`, `index.test.ts`, and `index.spec.js` are ignored.
