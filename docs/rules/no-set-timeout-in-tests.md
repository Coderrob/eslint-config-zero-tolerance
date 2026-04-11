# no-set-timeout-in-tests

Disallow `setTimeout` usage in test files.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Real-time sleeps make tests slower and timing-dependent. A passing test can still be waiting longer than necessary, while a failing test may only fail under CI load or on slower machines. Prefer fake timers, explicit async coordination, or framework polling helpers that wait for an observable condition.

This rule only runs in recognized test files: `*.test.*`, `*.spec.*`, `*.e2e.*`, `*.integration.*`, and files under `__tests__/`.

## Examples

### Correct

```typescript
vi.useFakeTimers();

const pending = promiseUnderTest();
vi.advanceTimersByTime(100);
await pending;

await waitFor(() => expect(screen.getByText('Done')).toBeVisible());
```

### Incorrect

```typescript
setTimeout(assertLater, 100);
globalThis.setTimeout(assertLater, 100);
window.setTimeout(assertLater, 100);
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-set-timeout-in-tests': 'error'
```
