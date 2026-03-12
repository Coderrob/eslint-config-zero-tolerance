# no-boolean-return-trap

Disallow ambiguous boolean-return APIs outside predicate naming.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Boolean returns can be ambiguous at call sites. Public APIs should either use predicate naming (`is*`, `has*`, `can*`, `should*`) or return richer result types.

## Examples

### Correct

```typescript
function isReady(user: User): boolean {
  return user.status === 'ready';
}
```

### Incorrect

```typescript
function validateUser(user: User): boolean {
  return user.status === 'ready';
}
```

## Configuration

```js
'zero-tolerance/no-boolean-return-trap': 'error'
```
