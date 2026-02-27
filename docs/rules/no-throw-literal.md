# no-throw-literal

Disallow throwing literals, plain objects, or template strings; always throw a `new Error()` instance.

## Rule Details

|            |           |
| ---------- | --------- | --- | ----------- | --- | --- | --------------- | ------ |
| **Type**   | `problem` |     | **Fixable** | No  |     | **Recommended** | `warn` |
| **Strict** | `error`   |

## Rationale

Only `Error` instances (and subclasses) include a `stack` trace. Throwing a string, object, number, or template literal discards that diagnostic information, making it impossible to trace where the error originated. Code that catches errors also often assumes it receives an `Error` object, so non-Error throws can cause secondary failures in error-handling paths.

**Allowed throw arguments:**

| Node type          | Example                               |
| ------------------ | ------------------------------------- |
| `NewExpression`    | `throw new Error('msg')`              |
| `Identifier`       | `throw err` (re-throw a caught error) |
| `MemberExpression` | `throw this.lastError`                |
| `CallExpression`   | `throw createError('msg')`            |
| `AwaitExpression`  | `throw await buildError()`            |

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
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-throw-literal': 'error'
```
