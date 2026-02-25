# no-magic-numbers

Disallow raw numeric literals in expressions; use named constants instead.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

Magic numbers are numeric literals that appear without explanation. They make code hard to read (what does `86400` mean?) and hard to maintain (every occurrence must be updated if the value changes). Extracting them into named constants adds meaning and creates a single source of truth.

**Allowed values:** `0`, `1`, and `-1` are universally understood and are always permitted.

**Allowed locations:**
- `const` variable initialisers — this is how you _define_ a named constant
- TypeScript `enum` member values

## Examples

### ✅ Correct

```typescript
const SECONDS_PER_DAY = 86400;
const MAX_RETRIES = 3;
const HTTP_OK = 200;

// Allowed sentinel values
const index = -1;
const first = arr[0];
const length = arr.length + 1;
```

### ❌ Incorrect

```typescript
setTimeout(callback, 86400 * 1000);

if (response.status === 200) { /* ... */ }

const retries = 3;  // let or var declaration — not a named const
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-magic-numbers': 'error'
```
