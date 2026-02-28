# max-function-lines

Enforce a maximum number of lines per function body.

## Rule Details

| Property        | Value             |
| --------------- | ----------------- |
| **Type**        | `suggestion`      |
| **Fixable**     | No                |
| **Recommended** | `warn` (max: 20)  |
| **Strict**      | `error` (max: 10) |

## Rationale

Long functions are harder to understand, test, and maintain. Keeping functions small forces a single-responsibility design: each function does one thing, has a clear name, and can be tested in isolation. This rule counts the lines of a function's block body (inclusive of opening and closing braces) and reports any function that exceeds the configured limit. Arrow functions with concise expression bodies (no block) are not checked.

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

| Option | Type     | Default | Description                              |
| ------ | -------- | ------- | ---------------------------------------- |
| `max`  | `number` | `30`    | Maximum allowed lines in a function body |

The standalone default is **30** lines. The `recommended` preset overrides this to **20** and the `strict` preset to **10**.

```js
// Use the recommended preset value (20 lines)
'zero-tolerance/max-function-lines': 'warn'

// Custom limit
'zero-tolerance/max-function-lines': ['error', { max: 50 }]
```
