# no-redundant-boolean

Disallow redundant comparisons to `true` or `false` (Sonar S1125).

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Comparing a boolean expression to `true` or `false` adds noise without adding meaning. `isValid === true` is identical to `isValid`; `isActive !== false` is identical to `isActive`. These redundant comparisons obscure intent and are commonly introduced by developers who are uncertain about the type of the value.

**Checked operators:** `===`, `!==`

## Autofix

The fixer removes redundant boolean comparisons, simplifies `condition ? true : false` and `condition ? false : true`, and removes `!!` only when the wrapped expression is syntactically known to already produce a boolean.

## Examples

### ✅ Correct

```typescript
if (isValid) {
  /* ... */
}

if (!isActive) {
  /* ... */
}

return hasPermission;
```

### ❌ Incorrect

```typescript
if (isValid === true) {
  /* ... */
}

if (isActive !== false) {
  /* ... */
}

return hasPermission === true;
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-redundant-boolean': 'error'
```
