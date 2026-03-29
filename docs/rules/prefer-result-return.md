# prefer-result-return

Prefer returning Result-style values instead of throwing.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `warn`       |

## Rationale

Returning typed error values keeps failures explicit in function signatures and avoids hidden control-flow jumps from thrown exceptions.

## Examples

### Correct

```typescript
function parse(input: string) {
  return { ok: false as const, error: 'invalid' };
}
```

### Incorrect

```typescript
function parse(input: string) {
  throw new Error('invalid');
}
```

## Configuration

```js
'zero-tolerance/prefer-result-return': 'warn'
```
