# no-jest-have-been-called

Prohibit `toHaveBeenCalled` and `toHaveBeenCalledWith`; use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

`toHaveBeenCalled` only asserts that a mock was called _at least once_ without specifying how many times. `toHaveBeenCalledWith` does not specify _which_ invocation is being checked. Both matchers can pass for the wrong reasons, producing false confidence.

Using `toHaveBeenCalledTimes(n)` forces you to declare the exact call count. Using `toHaveBeenNthCalledWith(n, ...args)` forces you to assert the arguments for a specific invocation. Together they produce precise, non-ambiguous test assertions.

| Banned | Replacement |
|---|---|
| `toHaveBeenCalled` | `toHaveBeenCalledTimes` |
| `toHaveBeenCalledWith` | `toHaveBeenNthCalledWith` |

## Examples

### ✅ Correct

```typescript
expect(mockFn).toHaveBeenCalledTimes(1);

expect(mockFn).toHaveBeenNthCalledWith(1, 'expected-argument');
```

### ❌ Incorrect

```typescript
expect(mockFn).toHaveBeenCalled();

expect(mockFn).toHaveBeenCalledWith('expected-argument');
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-jest-have-been-called': 'error'
```
