# max-params

Enforce a maximum number of function parameters.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` (max: 4) |
| **Strict** | `error` (max: 4) |

## Rationale

Functions with many parameters are hard to call correctly, difficult to read, and a sign that the function is doing too much or that related parameters should be grouped into a structured options object. Limiting the parameter count encourages better API design.

## Examples

### ✅ Correct

```typescript
/**
 * Creates a new user record.
 */
function createUser(options: ICreateUserOptions): Promise<IUser> {
  return db.users.create(options);
}

/**
 * Sends an email notification.
 */
function sendEmail(to: string, subject: string, body: string): Promise<void> {
  return mailer.send({ to, subject, body });
}
```

### ❌ Incorrect

```typescript
function createUser(
  name: string,
  email: string,
  password: string,
  role: string,
  createdAt: Date,
): Promise<IUser> {
  // Too many positional parameters
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `max` | `number` | `4` | Maximum number of allowed parameters |

```js
// Default (max 4)
'zero-tolerance/max-params': 'warn'

// Custom limit
'zero-tolerance/max-params': ['error', { max: 3 }]
```
