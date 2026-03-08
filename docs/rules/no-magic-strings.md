# no-magic-strings

Disallow magic string literals in comparisons and switch-case clauses; use named constants instead.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

String literals used in comparisons (`=== 'admin'`) or `switch` cases are magic strings: their meaning is implicit, they can be mis-typed silently, and every occurrence must be updated if the value changes. Defining them as named constants (`const ROLE_ADMIN = 'admin'`) adds meaning and creates a single source of truth.

**Checked locations:**

- `===`, `!==`, `==`, `!=` binary comparisons
- `switch` case test values

`typeof` comparisons are exempt (for example, `typeof value === 'string'`).

## Examples

### ✅ Correct

```typescript
const ROLE_ADMIN = 'admin';
const STATUS_ACTIVE = 'active';

if (user.role === ROLE_ADMIN) {
  /* ... */
}

switch (user.status) {
  case STATUS_ACTIVE:
    break;
}
```

### ❌ Incorrect

```typescript
if (user.role === 'admin') {
  /* ... */
}

switch (user.status) {
  case 'active':
    break;
  case 'inactive':
    break;
}
```

## Configuration

This rule accepts an optional options object:

```js
'zero-tolerance/no-magic-strings': [
  'error',
  {
    checkComparisons: true,
    checkSwitchCases: true,
    ignoreValues: ['production'],
  },
]
```
