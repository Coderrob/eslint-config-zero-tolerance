# no-parameter-reassign

Disallow assignments and updates to function parameters.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Reassigning parameters is a common code smell that makes control flow harder to follow and hides intent. Prefer introducing a new local variable (`Extract Variable` / `Split Variable`) instead of mutating the input parameter.

## Examples

### ✅ Correct

```typescript
function normalize(value: string): string {
  let normalized = value.trim();
  normalized = normalized.toLowerCase();
  return normalized;
}
```

### ❌ Incorrect

```typescript
function normalize(value: string): string {
  value = value.trim();
  value = value.toLowerCase();
  return value;
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-parameter-reassign': 'error'
```

## Parsing and fix safety

The rule resolves parameter bindings through ESLint scope analysis. It detects writes from closures, destructured bindings, and destructuring assignments while allowing writes to shadowing local variables.
