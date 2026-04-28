# no-re-export

Disallow direct and pass-through re-export statements from parent or ancestor modules in non-barrel files.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Re-export statements that reach outside the current directory (`../`) create upward dependencies that violate proper module hierarchy. That includes direct re-exports such as `export { foo } from '../foo'` and pass-through patterns such as `import { foo } from '../foo'; export { foo };`. Statement ordering does not matter: `export { foo }; import { foo } from '../foo';` is also reported. Barrel files (`index.*`) remain exempt from this rule because their re-export path policy is enforced separately by `require-barrel-relative-exports`. All other files must not re-export from peer modules (`../sibling`) or ancestors (`../../parent`, `../../../grandparent`).

## Notes

- The barrel-file exemption applies only to single-extension index files such as `index.ts`, `index.js`, and `index.mts`.
- Double-extension files such as `index.d.ts`, `index.test.ts`, and `index.spec.js` are not treated as barrel files and are still checked by this rule.

## Examples

### ✅ Correct

```typescript
// Direct exports
export { foo, bar };
export const value = 42;
export function myFunction() {}

// Re-exports from children (always allowed)
export { childFunction } from './child';
export * from './child/utils';

// Exporting a local binding remains allowed
import { parentValue } from '../parent';
const localValue = parentValue;
export { localValue };

// In a barrel file, this rule stays silent because
// require-barrel-relative-exports owns barrel re-export path policy.
```

### ❌ Incorrect

```typescript
// Re-exports from peers are not allowed in non-barrel files
export { peerFunction } from '../sibling';
export * from '../utils';

// Re-exports from parents are not allowed
export { parentFunction } from '../../parent';
export * from '../../grandparent';

// Pass-through re-exports from parents are also not allowed
import { peerFunction } from '../sibling';
export { peerFunction };

import parentDefault from '../../parent';
export default parentDefault;

// Re-exports from grandparents are not allowed
export { grandparentFunction } from '../../../ancestor';
export * as ns from '../../../../distant-ancestor';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-re-export': 'error'
```
