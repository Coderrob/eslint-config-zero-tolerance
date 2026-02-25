# no-await-in-loop

Disallow `await` expressions inside loop bodies; use `Promise.all()` or `Promise.allSettled()` instead.

## Rule Details

| | |
|---|---|
| **Type** | `problem` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

`await` inside a loop serialises asynchronous operations: each iteration waits for the previous one to finish before starting the next. This is almost never the intended behaviour and is a significant performance bottleneck. `Promise.all()` runs the operations in parallel, completing in the time of the slowest single operation rather than the sum of all operations.

The rule detects `await` inside `for`, `for...in`, `for...of`, `while`, and `do...while` loops. It does **not** flag `await` inside callbacks or async functions nested within the loop body.

## Examples

### ✅ Correct

```typescript
// Run all requests in parallel
const results = await Promise.all(ids.map(id => fetchUser(id)));

// Settle all, collecting errors
const settled = await Promise.allSettled(items.map(item => process(item)));
```

### ❌ Incorrect

```typescript
for (const id of ids) {
  // Serialised — each request waits for the previous
  const user = await fetchUser(id);
  users.push(user);
}

while (queue.length > 0) {
  const item = queue.shift()!;
  await process(item);
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-await-in-loop': 'error'
```
