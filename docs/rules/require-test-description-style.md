# require-test-description-style

Enforce that `it()` and `test()` descriptions start with the word `should`.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

Test descriptions starting with `should` form a consistent, human-readable specification language. Reading them aloud reveals the intended behaviour: "it should render correctly", "it should throw when the input is invalid". This convention makes test reports self-documenting and helps reviewers scan failures quickly.

The rule applies to `it()`, `test()`, `it.only()`, and `test.only()`. It deliberately skips `it.skip()` and `test.skip()` to avoid friction when temporarily disabling tests.

## Examples

### ✅ Correct

```typescript
it('should render correctly', () => {});

test('should throw when input is invalid', () => {});

it.only('should handle concurrent requests', () => {});
```

### ❌ Incorrect

```typescript
it('renders correctly', () => {});

test('handles errors', () => {});

it('Check that user is saved', () => {});
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-test-description-style': 'error'
```
