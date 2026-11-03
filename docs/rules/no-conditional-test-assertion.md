# no-conditional-test-assertion

Require assertions in test files to execute on every applicable path.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

An assertion inside an `if`, ternary branch, short-circuit right operand, `catch`, switch case, or loop body can be skipped. A test can then pass without checking the intended behavior. Split the cases into separate tests or place an assertion after conditional setup.

The rule recognizes Jest and Vitest `expect`, Chai `expect` and `assert`, Sinon `assert`, and imported Node `assert` (including direct calls). It supports aliases, Vitest local test-context `expect`, supported namespace access, and computed properties. It checks test files and recognizes assertions inside promise `catch` callbacks. A conditional expression used to prepare an assertion's input is allowed. Assertions inside `for…of` loops over array literals with a fixed element are allowed because the loop body must execute.

### Correct

```typescript
test('should select the expected value', () => {
  const actual = condition ? first : second;
  expect(actual).toBe(expected);
});
```

### Incorrect

```typescript
test('should select the expected value', () => {
  if (condition) {
    expect(actual).toBe(expected);
  }
});
```

## Configuration

```js
'zero-tolerance/no-conditional-test-assertion': 'error'
```

This rule checks whether a present assertion can be skipped. It does not require every test to contain an assertion.
