# no-chai-imprecise-spy-assertions

Require explicit counts and invocation arguments in Chai-style spy assertions.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Sinon–Chai's `.called` property asserts at least one call. `.calledWith(...)`, `.calledWithExactly(...)`, and `.calledWithMatch(...)` can pass because any invocation matches. Vitest's Chai-style `.lastCalledWith(...)` relies on an implicit last invocation. Use an exact count and, when arguments matter, inspect the intended call.

The rule recognizes `expect` imported from `chai` or `vitest`, including aliases, `chai.expect(...)` from default or namespace imports, and Vitest `expect.soft(...)`. It follows Chai language chains such as `.to.be`, `.that.has.been`, and computed properties. The negated `.not.called` property is allowed because it asserts zero calls. Exact one-call assertions such as `.calledOnceWithExactly(...)` and argument assertions on `spy.getCall(index)` are allowed.

### Correct

```typescript
import { expect } from 'chai';

expect(spy).to.have.callCount(2);
expect(spy.getCall(0).args).to.deep.equal(['first']);
expect(spy.getCall(0)).to.have.been.calledWithExactly('first');
expect(spy).to.not.have.been.called;
```

### Incorrect

```typescript
import { expect } from 'chai';

expect(spy).to.have.been.called;
expect(spy).to.be.called;
expect(spy).to.have.been.calledWith('first');

import { expect as vitestExpect } from 'vitest';
vitestExpect(spy).to.have.been.lastCalledWith('last');
```

## Configuration

```js
'zero-tolerance/no-chai-imprecise-spy-assertions': 'error'
```

Mocha does not supply its own assertion API; this rule applies to Mocha tests that use Chai and Sinon–Chai. It does not infer Sinon spies from arbitrary object properties or inspect `should`-style assertions.
