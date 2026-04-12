# no-date-now

Disallow `Date.now()` and `new Date()` without arguments.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Direct time reads create non-deterministic code that is harder to test. Injecting a clock or passing timestamps improves testability and reproducibility.

## Examples

### ✅ Correct

```typescript
const timestamp = clock.now();
```

### ❌ Incorrect

```typescript
const timestamp = Date.now();
const createdAt = new Date();
```

## Configuration

```js
'zero-tolerance/no-date-now': 'error'
```
