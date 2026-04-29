# no-ts-nocheck

Prevent use of `@ts-nocheck` comments.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

`@ts-nocheck` disables TypeScript diagnostics for an entire file. That hides type errors at the file boundary and allows unsafe code to accumulate. Fix the underlying type errors instead of turning the checker off.

## Examples

### ✅ Correct

```typescript
// @ts-expect-error intentional negative test for a public type
const value: string = 1;
```

### ❌ Incorrect

```typescript
// @ts-nocheck
const value: string = 1;

/* @ts-nocheck */
const otherValue: number = 'wrong';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-ts-nocheck': 'error'
```
