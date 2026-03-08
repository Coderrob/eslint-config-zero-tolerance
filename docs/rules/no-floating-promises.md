# no-floating-promises

Disallow unhandled promise expressions. Promise-producing expressions must be explicitly handled with `await`, `void`, `.catch(...)`, or `then(..., onRejected)`.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Floating promises frequently hide failures and create non-deterministic behavior. This rule enforces explicit handling so async intent is visible and rejected promises are not silently ignored.

The rule checks explicit promise-producing patterns such as:

- dynamic `import(...)`
- `new Promise(...)`
- async IIFE calls (`(async () => ...)()`)
- promise chains using `.then(...)`, `.catch(...)`, and `.finally(...)`
- Promise static calls such as `Promise.resolve(...)` and `Promise.all(...)`

## Examples

### ✅ Correct

```typescript
await import('./worker');

void bootstrapAsync();

fetchData().catch(handleError);

fetchData().then(handleData, handleError);
```

### ❌ Incorrect

```typescript
import('./worker');

Promise.resolve(42);

(async () => {
  await bootstrapAsync();
})();

fetchData().then(handleData);
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-floating-promises': 'error'
```
