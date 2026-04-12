# prefer-guard-clauses

Prefer guard clauses over `else` blocks after terminating `if` branches.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

When an `if` branch already returns or throws, keeping an `else` block adds unnecessary nesting. Flattening with guard clauses improves readability and aligns with `Replace Nested Conditional with Guard Clauses`.

## Examples

### ✅ Correct

```typescript
if (!user) {
  return;
}
processUser(user);
```

### ❌ Incorrect

```typescript
if (!user) {
  return;
} else {
  processUser(user);
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/prefer-guard-clauses': 'error'
```
