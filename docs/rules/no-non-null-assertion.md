# no-non-null-assertion

Disallow non-null assertions using the `!` postfix operator.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

The `!` postfix operator tells TypeScript to treat an expression as non-null without any runtime check. If the value is actually `null` or `undefined` at runtime, the assertion causes a crash rather than a handled error. Use optional chaining (`?.`), nullish coalescing (`??`), or an explicit null check instead.

## Examples

### ✅ Correct

```typescript
// Optional chaining
const name = user?.profile?.name;

// Nullish coalescing
const displayName = user?.name ?? 'Anonymous';

// Explicit null check
if (element !== null) {
  element.focus();
}
```

### ❌ Incorrect

```typescript
const name = user!.profile!.name;

document.getElementById('root')!.innerHTML = '';

const value = maybeNull!;
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-non-null-assertion': 'error'
```
