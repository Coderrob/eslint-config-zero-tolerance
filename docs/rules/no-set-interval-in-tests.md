# no-set-interval-in-tests

Disallow `setInterval` usage in test files.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Intervals in tests create background work that can leak across assertions, suites, or worker lifetimes. Prefer fake timers, direct event triggering, or a test helper that exposes a deterministic signal.

This rule only runs in recognized test files: `*.test.*`, `*.spec.*`, `*.e2e.*`, `*.integration.*`, and files under `__tests__/`.

## Examples

### ✅ Correct

```typescript
vi.useFakeTimers();

const subscription = startPolling();
vi.advanceTimersByTime(1000);
subscription.stop();
```

### ❌ Incorrect

```typescript
setInterval(poll, 1000);
global.setInterval(poll, 1000);
window.setInterval(poll, 1000);
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-set-interval-in-tests': 'error'
```
