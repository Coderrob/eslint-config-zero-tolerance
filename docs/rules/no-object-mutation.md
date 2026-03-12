# no-object-mutation

Disallow direct object-property mutation.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Mutating object properties in place introduces side effects and makes state transitions harder to trace. Immutable updates improve predictability.

## Examples

### Correct

```typescript
const next = { ...state, count: state.count + 1 };
```

### Incorrect

```typescript
state.count = state.count + 1;
```

## Configuration

```js
'zero-tolerance/no-object-mutation': 'error'
```
