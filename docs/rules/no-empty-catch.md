# no-empty-catch

Disallow empty catch blocks that silently swallow errors.

## Rule Details

| | |
|---|---|
| **Type** | `problem` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

An empty `catch` block discards the error entirely. The caller has no indication that anything went wrong, diagnostics are impossible, and bugs become untraceable. Every caught error must be handled in some meaningful way: logged, re-thrown, returned as a result, or surfaced to the user.

## Examples

### ✅ Correct

```typescript
try {
  riskyOperation();
} catch (err) {
  logger.error('riskyOperation failed', err);
}

try {
  connectToDb();
} catch (err) {
  throw new Error(`Database connection failed: ${err}`);
}

try {
  cleanup();
} catch {
  throw new Error('Cleanup step failed');
}
```

### ❌ Incorrect

```typescript
try {
  riskyOperation();
} catch (err) {}

try {
  connectToDb();
} catch {}

try {
  cleanup();
} catch (err) {} finally {
  teardown();
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-empty-catch': 'error'
```
