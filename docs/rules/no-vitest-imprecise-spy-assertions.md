# no-vitest-imprecise-spy-assertions

Require exact call counts and numbered invocation arguments in Vitest spy assertions.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`toHaveBeenCalled()` proves only that a spy was called at least once. `toHaveBeenCalledWith(...)` can pass when any invocation matches, and `toHaveBeenLastCalledWith(...)` relies on an implicit last invocation. Use an exact count or a numbered call instead.

The rule recognizes `expect` imported from `vitest`, including aliases, `expect.soft(...)`, computed matchers, and `not`, `resolves`, and `rejects` chains. `not.toHaveBeenCalled()` is allowed because it asserts zero calls, including after `expect.soft(...)`. `toHaveBeenCalledExactlyOnceWith(...)` is also allowed.

### Correct

```typescript
import { expect } from 'vitest';

expect(spy).toHaveBeenCalledTimes(2);
expect(spy).toHaveBeenNthCalledWith(1, 'first');
expect(spy).not.toHaveBeenCalled();
expect.soft(spy).not.toHaveBeenCalled();
```

### Incorrect

```typescript
import { expect } from 'vitest';

expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith('first');
expect(spy).toHaveBeenLastCalledWith('last');
expect.soft(spy).toHaveBeenCalled();
```

## Configuration

```js
'zero-tolerance/no-vitest-imprecise-spy-assertions': 'error'
```

The rule targets imported Vitest `expect` bindings. Global `expect` calls use Jest-compatible syntax and are covered by `no-jest-have-been-called`.
