# max-function-lines

Enforce a maximum number of lines per function body.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` (max: 30) |
| **Strict** | `error` (max: 20) |

## Rationale

Long functions are harder to understand, test, and maintain. Keeping functions small forces a single-responsibility design: each function does one thing, has a clear name, and can be tested in isolation. This rule flags any function body that exceeds the configured line limit.

## Examples

### ✅ Correct

```typescript
/**
 * Validates a user registration payload.
 */
function validateRegistration(payload: IRegistrationPayload): IValidationResult {
  const errors: string[] = [];
  if (!payload.email) errors.push('Email is required');
  if (!payload.password) errors.push('Password is required');
  return { valid: errors.length === 0, errors };
}
```

### ❌ Incorrect (exceeds limit)

```typescript
function doEverything(user: IUser) {
  // 35+ lines of mixed concerns...
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `max` | `number` | `30` | Maximum allowed lines in a function body |

```js
// Recommended (default 30 lines)
'zero-tolerance/max-function-lines': 'warn'

// Custom limit
'zero-tolerance/max-function-lines': ['error', { max: 50 }]
```
