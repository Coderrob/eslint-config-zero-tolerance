# no-jest-have-been-called

Prohibit imprecise call-assertion matchers; use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`toHaveBeenCalled` / `toBeCalled` only asserts that a mock was called _at least once_ without specifying how many times. `toHaveBeenCalledWith` / `toBeCalledWith` does not specify _which_ invocation is being checked. `toHaveBeenLastCalledWith` / `toLastCalledWith` implicitly asserts only the final invocation, silently ignoring all others. All of these matchers can pass for the wrong reasons, producing false confidence.

Using `toHaveBeenCalledTimes(n)` forces you to declare the exact call count. Using `toHaveBeenNthCalledWith(n, ...args)` forces you to assert the arguments for a specific invocation. Together they produce precise, non-ambiguous test assertions.

| Banned                     | Replacement               |
| -------------------------- | ------------------------- |
| `toHaveBeenCalled`         | `toHaveBeenCalledTimes`   |
| `toBeCalled`               | `toHaveBeenCalledTimes`   |
| `toHaveBeenCalledWith`     | `toHaveBeenNthCalledWith` |
| `toBeCalledWith`           | `toHaveBeenNthCalledWith` |
| `toHaveBeenLastCalledWith` | `toHaveBeenNthCalledWith` |
| `toLastCalledWith`         | `toHaveBeenNthCalledWith` |

## Examples

### ✅ Correct

```typescript
expect(mockFn).toHaveBeenCalledTimes(1);

expect(mockFn).toHaveBeenNthCalledWith(1, 'expected-argument');
```

### ❌ Incorrect

```typescript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toBeCalled();

expect(mockFn).toHaveBeenCalledWith('expected-argument');
expect(mockFn).toBeCalledWith('expected-argument');

expect(mockFn).toHaveBeenLastCalledWith('expected-argument');
expect(mockFn).toLastCalledWith('expected-argument');
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-jest-have-been-called': 'error'
```
