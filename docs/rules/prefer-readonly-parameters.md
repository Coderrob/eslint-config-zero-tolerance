# prefer-readonly-parameters

Prefer readonly typing for object and array-like function parameters.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Function parameters are inputs. Treating object and array parameters as readonly prevents accidental mutation and preserves referential transparency.

## Examples

### Correct

```typescript
function format(user: Readonly<User>): string {
  return user.name;
}
```

### Incorrect

```typescript
function format(user: User): string {
  return user.name;
}
```

## Configuration

```js
'zero-tolerance/prefer-readonly-parameters': 'error'
```
