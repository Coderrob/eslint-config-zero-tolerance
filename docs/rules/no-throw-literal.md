# no-throw-literal

Disallow throwing literals, plain objects, or template strings; always throw a `new Error()` instance.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Only `Error` instances (and subclasses) include a `stack` trace. Throwing a string, object, number, or template literal discards diagnostic information and can break error-handling code that expects an `Error`.

By default, this rule only allows:

- `throw new ...` expressions (for example `throw new Error(...)`)
- re-throwing the active catch parameter (for example `catch (err) { throw err; }`)

You can opt into allowing `throw <call>`, `throw <member>`, and `throw await <expr>` with rule options.

## Examples

### ✅ Correct

```typescript
throw new Error('something went wrong');

throw new TypeError('expected a string');

throw new RangeError('value out of range');

class ValidationError extends Error {}
throw new ValidationError('invalid input');

// Re-throwing a caught error
try {
  riskyOp();
} catch (err) {
  throw err;
}
```

### ❌ Incorrect

```typescript
throw 'something went wrong';

throw 404;

throw { message: 'error', code: 500 };

throw `failed: ${reason}`;

throw condition ? 'error-a' : 'error-b';

throw createError('message');
```

## Configuration

This rule accepts an optional options object:

```js
'zero-tolerance/no-throw-literal': [
  'error',
  {
    allowThrowingCallExpressions: false,
    allowThrowingMemberExpressions: false,
    allowThrowingAwaitExpressions: false,
  },
]
```
