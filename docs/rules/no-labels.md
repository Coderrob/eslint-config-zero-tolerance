# no-labels

Disallow labeled statements.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Labels introduce goto-like control flow (`break label`, `continue label`) that makes code harder to follow and maintain. Prefer extracting logic into functions or using clearer loop structures.

## Examples

### ✅ Correct

```typescript
for (const row of rows) {
  if (!row.valid) {
    break;
  }
}
```

### ❌ Incorrect

```typescript
outer: for (const row of rows) {
  for (const cell of row.cells) {
    if (!cell.valid) {
      break outer;
    }
  }
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-labels': 'error'
```
