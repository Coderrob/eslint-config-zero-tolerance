# no-unawaited-async-assertion

Require an asynchronous test assertion to be awaited or returned.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Jest promise matchers, Vitest polling and browser assertions, and Chai-as-promised assertions return a promise. Discarding that result can let a test finish before the assertion fails. The rule reports a direct assertion statement, including one prefixed with `void`, when the assertion promise is not awaited or returned.

It recognizes Jest and Vitest `resolves` and `rejects`; Vitest `expect.poll` and `expect.element`; Chai-as-promised `eventually`, `rejected`, `fulfilled`, `rejectedWith`, and `become`; and Chai's asynchronous `assert` methods. Imported aliases, local `expect` from a Vitest test callback, and static computed properties are supported. Chai-as-promised `.notify(done)` is allowed because the callback handles completion. The rule runs only in recognized test files.

### Correct

```typescript
test('should resolve', async () => {
  await expect(load()).resolves.toBe('ready');
});

test('should reject', () => {
  return expect(load()).rejects.toThrow();
});
```

### Incorrect

```typescript
test('should resolve', () => {
  expect(load()).resolves.toBe('ready');
});

test('should find the element', () => {
  expect.poll(() => findElement()).toBeVisible();
});
```

## Configuration

```js
'zero-tolerance/no-unawaited-async-assertion': 'error'
```

The rule checks direct discarded assertion statements. Use a type-aware floating-promise rule to cover promises passed through variables or other expressions.
