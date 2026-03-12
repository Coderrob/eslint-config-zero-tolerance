# no-array-mutation

Disallow mutating array methods.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Mutating arrays in place creates hidden side effects. Immutable array operations make behavior easier to reason about and safer to refactor.

## Examples

### Correct

```typescript
const next = [...items, value];
```

### Incorrect

```typescript
items.push(value);
```

## Configuration

```js
'zero-tolerance/no-array-mutation': 'error'
```
