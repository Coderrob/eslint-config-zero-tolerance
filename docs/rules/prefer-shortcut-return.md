# prefer-shortcut-return

Prefer shortcut boolean returns over `if` branches that return `true`/`false`.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

When code branches only to return opposite boolean literals, the extra control flow is unnecessary. A direct return is shorter and easier to read.

## Examples

### ✅ Correct

```typescript
function isReady(value: unknown): boolean {
  return !!value;
}

function isDisabled(value: unknown): boolean {
  return !value;
}
```

### ❌ Incorrect

```typescript
function isReady(value: unknown): boolean {
  if (value) return true;
  return false;
}

function isDisabled(value: unknown): boolean {
  if (value) {
    return false;
  } else {
    return true;
  }
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/prefer-shortcut-return': 'error'
```

## Behavioral contract

The rule skips a replacement when its full source span contains comments, including comments between the `if` and the following return. This retains explanations and tool directives. Eligible rewrites use `!!` or `!` so falsy parameters still return booleans.
