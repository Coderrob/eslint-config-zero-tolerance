# no-sinon-imprecise-spy-assertions

Require explicit call counts and numbered-call argument checks in Sinon assertions.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`sinon.assert.called(spy)` only requires one or more calls. The `calledWith` variants match any invocation when passed the whole spy. Use `callCount(spy, n)` for an exact count and pass `spy.getCall(index)` to an argument assertion when a particular invocation matters.

The rule recognizes default, namespace, and named `assert` imports from `sinon`, including aliases and computed method names. `notCalled`, `calledOnce`, and `calledOnceWithExactly` are allowed because their counts are explicit.

### Correct

```typescript
import sinon from 'sinon';

sinon.assert.callCount(spy, 2);
sinon.assert.calledWithExactly(spy.getCall(0), 'first');
sinon.assert.notCalled(spy);
```

### Incorrect

```typescript
import sinon from 'sinon';

sinon.assert.called(spy);
sinon.assert.calledWith(spy, 'first');
sinon.assert.calledWithExactly(spy, 'first');
```

## Configuration

```js
'zero-tolerance/no-sinon-imprecise-spy-assertions': 'error'
```

This rule applies regardless of the test runner, including Mocha. It checks `sinon.assert` calls rather than arbitrary spy methods or properties.
