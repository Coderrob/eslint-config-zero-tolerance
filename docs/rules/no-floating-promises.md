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

## Behavioral contract

The rule resolves stable local async function declarations and initialized async arrows by lexical binding. A synchronous parameter or local declaration with the same name is respected, and bindings are never carried between files. Async generators return iterators and are not treated as promises. When TypeScript parser services are available, promise-returning external calls and promise-valued expressions are checked too. Without those services, unknown external return types and aliases remain outside the syntactic check.

A rejection callback must appear on the terminal call. `.catch(handleError).then(work)` and `.catch(handleError).finally(cleanup)` produce new promises that need handling. Missing, `null`, or `undefined` callbacks are not handlers. Inline callbacks that visibly rethrow, return `Promise.reject`, or are async also require handling. Arbitrary callback references are accepted as explicit intent; the rule does not prove that their implementations cannot throw.
