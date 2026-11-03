# no-jest-have-been-called

Require explicit call counts and invocation indices in Jest `expect(...)` assertions. Negated `toHaveBeenCalled` and `toBeCalled` assertions are allowed because they assert zero calls.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`toHaveBeenCalled` / `toBeCalled` only asserts that a mock was called _at least once_ without specifying how many times. `toHaveBeenCalledWith` / `toBeCalledWith` does not specify _which_ invocation is being checked. `toHaveBeenLastCalledWith` / `toLastCalledWith` implicitly asserts only the final invocation, silently ignoring all others. All of these matchers can pass for the wrong reasons, producing false confidence.

The negated `not.toHaveBeenCalled()` and `not.toBeCalled()` forms assert exactly zero calls, so the rule allows them.

Using `toHaveBeenCalledTimes(n)` forces you to declare the exact call count. Using `toHaveBeenNthCalledWith(n, ...args)` forces you to assert the arguments for a specific invocation. Together they produce precise, non-ambiguous test assertions.

The rule checks calls on `expect(...)`, `globalThis.expect(...)`, and `global.expect(...)`, including aliases imported from `@jest/globals`. It follows `not`, `resolves`, and `rejects` modifiers. A same-named method on an unrelated object, or a matcher property read without a call, is allowed.

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

expect(mockFn).not.toHaveBeenCalled();
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

## Parsing and fix safety

Object prototype properties, including optional and bracket access to `toString`, `valueOf`, and `constructor`, are allowed. Async, computed, and optional banned matcher calls remain reported when they belong to a Jest assertion. Negated argument matchers such as `not.toHaveBeenCalledWith(...)` remain reported.
