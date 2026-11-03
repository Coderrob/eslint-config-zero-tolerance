# no-await-in-loop

Review repeated waits inside loops and allow intentional sequential work.

Type: problem. No automatic fix.

## What it checks

Reports explicit await expressions inside loops. An await in a nested function is checked in that function's own scope. Type assertions and optional calls do not change this behavior.

Retries, pagination, and rate limits may require sequential work. Run independent work concurrently only when ordering, resources, and error handling permit it. Limit concurrency for large collections.

## Options

| Option                 | Default | Meaning                                                                               |
| ---------------------- | ------- | ------------------------------------------------------------------------------------- |
| `allowedFunctionNames` | []      | Exact function names or function-valued variable names allowed to await inside loops. |
| `allowForAwaitOf`      | false   | Allow explicit awaits within for-await-of bodies, including nested loops.             |

```js
'zero-tolerance/no-await-in-loop': ['error', {
  allowedFunctionNames: ['retry', 'paginate'],
  allowForAwaitOf: true,
}]
```

## Examples

```typescript
async function loadAll(items) {
  for (const item of items) {
    await load(item); // Reported with default options.
  }
}

async function retry() {
  while (pending) {
    await attempt(); // Allowed when 'retry' is configured above.
  }
}
```

## Limits

Exceptions stop at nested function boundaries. A callback does not inherit an outer function's exception. A named exception allows all awaits within that function, so keep exception functions focused. Class and object method names are not matched by `allowedFunctionNames`.

The rule checks explicit await expressions, not the implicit waits performed by async iteration. It does not automatically replace loops with Promise.all.
