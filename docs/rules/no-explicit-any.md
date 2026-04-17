# no-explicit-any

Disallow explicit `any`.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `problem`    |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`any` turns off the type system exactly where code is most likely to drift. If a value is unknown, model it as `unknown` and narrow it deliberately, or define a real domain type.

## Examples

### ✅ Correct

```typescript
const payload: unknown = input;

function identity<T>(value: T): T {
  return value;
}
```

### ❌ Incorrect

```typescript
function read(value: any): string {
  return String(value);
}

type Payload = any;
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-explicit-any': 'error'
```
