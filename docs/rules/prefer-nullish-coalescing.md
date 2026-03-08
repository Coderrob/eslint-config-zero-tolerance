# prefer-nullish-coalescing

Prefer using the nullish coalescing operator (`??`) instead of ternary expressions that only guard against `null`/`undefined`.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

A nullish guard ternary (`value != null ? value : fallback`) is functionally equivalent to `value ?? fallback`, but the coalescing operator is shorter and more expressive about the intent to fall back only for `null`/`undefined` values.

## Examples

### Correct

```typescript
const userName = input ?? 'guest';
const description = config?.description ?? 'Not provided';
```

### Incorrect

```typescript
const userName = input != null ? input : 'guest';
const description = config == null ? 'Not provided' : config.description;
```

## Configuration

This rule has no options:

```js
'zero-tolerance/prefer-nullish-coalescing': 'error'
```
