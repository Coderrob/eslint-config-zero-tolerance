# no-identical-branches

Disallow identical branches in conditionals.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

If both branches of an `if/else` or ternary expression are identical, the condition is unnecessary noise. Consolidate shared logic (`Consolidate Duplicate Conditional Fragments`) and simplify the code.

## Examples

### Correct

```typescript
if (enabled) {
  runFastPath();
} else {
  runSafePath();
}
```

### Incorrect

```typescript
if (enabled) {
  execute();
} else {
  execute();
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-identical-branches': 'error'
```
