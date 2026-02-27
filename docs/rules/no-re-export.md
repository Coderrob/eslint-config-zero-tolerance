# no-re-export

Disallow re-export statements from parent or grandparent modules; barrel files may re-export from children or peer modules but not from ancestors.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Re-export statements from parent or grandparent modules (`export { foo } from '../../parent'` and `export * from '../../../grandparent'`) create upward dependencies that violate proper module hierarchy. While re-exports from children (`./child`) and peers (`../sibling`) are allowed to support barrel file patterns, re-exports that reach upward through the directory tree should be avoided to maintain clear dependency direction.

## Examples

### ✅ Correct

```typescript
// Direct exports
export { foo, bar };
export const value = 42;
export function myFunction() {}

// Re-exports from children (allowed)
export { childFunction } from './child';
export * from './child/utils';

// Re-exports from peers (allowed)
export { peerFunction } from '../sibling';
export * from '../utils';
```

### ❌ Incorrect

```typescript
// Re-exports from parents (two levels up — not allowed)
export { parentFunction } from '../../parent';
export * from '../../grandparent';

// Re-exports from grandparents (three or more levels up — not allowed)
export { grandparentFunction } from '../../../ancestor';
export * as ns from '../../../../distant-ancestor';
```
