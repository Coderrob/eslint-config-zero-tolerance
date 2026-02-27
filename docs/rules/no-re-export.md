# no-re-export

Disallow re-export statements from parent or ancestor modules in non-barrel files.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Re-export statements that reach outside the current directory (`../`) create upward dependencies that violate proper module hierarchy. Only barrel files (`index.*`) are exempt, as their sole purpose is to aggregate exports. All other files must not re-export from peer modules (`../sibling`) or ancestors (`../../parent`, `../../../grandparent`).

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

// In a barrel file (index.ts) — any re-export is allowed
// export { peerFunction } from '../sibling';
// export * from '../../parent';
```

### ❌ Incorrect

```typescript
// Re-exports from peers — not allowed in non-barrel files
export { peerFunction } from '../sibling';
export * from '../utils';

// Re-exports from parents — not allowed
export { parentFunction } from '../../parent';
export * from '../../grandparent';

// Re-exports from grandparents — not allowed
export { grandparentFunction } from '../../../ancestor';
export * as ns from '../../../../distant-ancestor';
```
