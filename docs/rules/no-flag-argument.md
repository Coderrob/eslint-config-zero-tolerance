# no-flag-argument

Disallow boolean flag parameters in function signatures.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Boolean flag arguments usually indicate a function doing more than one thing. Prefer explicit methods, a command object, or a parameter object (`Remove Flag Argument`, `Introduce Parameter Object`, `Replace Function with Command`).

## Examples

### ✅ Correct

```typescript
function renderPreview(): string {
  return 'preview';
}

function renderFull(): string {
  return 'full';
}
```

### ❌ Incorrect

```typescript
function render(isPreview: boolean): string {
  return isPreview ? 'preview' : 'full';
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-flag-argument': 'error'
```
