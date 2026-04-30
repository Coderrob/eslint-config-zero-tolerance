# no-hardcoded-secrets

Disallow hardcoded secrets, credentials, tokens, and secret-looking env defaults.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Credentials committed to source code are difficult to rotate and can expose production systems. Read secrets from managed configuration and avoid literal fallbacks.

## Examples

### Correct

```typescript
const token = process.env.API_TOKEN;

const fixture = 'dummy-secret-token';
```

### Incorrect

```typescript
const apiKey = 'sk_live_12345678901234567890';

const databaseUrl = 'postgres://user:password@database.internal/db';

const token = process.env.API_TOKEN ?? '12345678901234567890';
```

## Configuration

```js
'zero-tolerance/no-hardcoded-secrets': ['error', {
  allowedPatterns: ['test-', 'dummy', 'example', 'fake', 'placeholder'],
  minimumSecretLength: 16,
  checkTests: false
}]
```
