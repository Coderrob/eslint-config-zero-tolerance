# no-math-random

Disallow `Math.random()`.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `problem`    |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Ad hoc randomness makes behavior non-deterministic and difficult to test. Reading randomness through an injected generator or boundary keeps behavior explicit and reproducible.

## Examples

### ✅ Correct

```typescript
const value = rng.nextFloat();

const rounded = Math.round(value);
```

### ❌ Incorrect

```typescript
const value = Math.random();

const id = Math.floor(Math.random() * 10);
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-math-random': 'error'
```
