# no-eslint-disable

Prevent use of `eslint-disable` comments; fix the underlying issue instead.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

`eslint-disable` comments suppress rule violations rather than fixing them. They accumulate over time, making it impossible to know whether a rule violation is intentional or forgotten. A zero-tolerance codebase should have no suppression comments: every violation should be fixed at its source.

**Flagged comment forms:**

- `// eslint-disable`
- `// eslint-disable-next-line`
- `// eslint-disable-line`
- `/* eslint-disable */` block comments

## Examples

### ✅ Correct

```typescript
// Fix the underlying issue instead of disabling the rule
const MAX_SIZE = 100;
if (items.length > MAX_SIZE) {
  throw new Error('Too many items');
}
```

### ❌ Incorrect

```typescript
// eslint-disable-next-line zero-tolerance/no-magic-numbers
if (items.length > 100) { /* ... */ }

/* eslint-disable zero-tolerance/no-throw-literal */
throw 'something went wrong';
/* eslint-enable zero-tolerance/no-throw-literal */
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-eslint-disable': 'error'
```
