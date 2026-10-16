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

Comparing a known boolean expression to `true` or `false` adds noise without adding meaning. These comparisons can be simplified when the operand is boolean. For other types, strict comparisons have different semantics, so the rule reports the pattern without automatically removing the comparison.

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

## Parsing and fix safety

Autofixes for strict comparisons are limited to syntactically boolean operands. Unknown types are reported without a fix because `value === true` and `value` can differ. Boolean ternaries retain truthiness conversion, and fixes preserve expression grouping.
