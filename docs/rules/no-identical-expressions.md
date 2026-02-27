# no-identical-expressions

Disallow identical expressions on both sides of a binary or logical operator (Sonar S1764).

## Rule Details

|            |           |
| ---------- | --------- | --- | ----------- | --- | --- | --------------- | ------ |
| **Type**   | `problem` |     | **Fixable** | No  |     | **Recommended** | `warn` |
| **Strict** | `error`   |

## Rationale

When the left and right operands of a binary or logical expression are identical, the result is always deterministic — and almost certainly a copy-paste error. For example, `a === a` is always `true`, `x || x` is always `x`, and `n - n` is always `0`.

**Checked operators:** `===`, `!==`, `==`, `!=`, `&&`, `||`, `??`, `+`, `-`, `/`, `%`

## Examples

### ✅ Correct

```typescript
if (a === b) {
  /* ... */
}

const result = left || right;

const diff = endDate - startDate;
```

### ❌ Incorrect

```typescript
if (value === value) {
  /* always true */
}

const x = obj || obj; // always obj

const zero = count - count; // always 0

if (user && user) {
  /* user is checked twice */
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-identical-expressions': 'error'
```
