# require-exhaustive-switch

Require exhaustive `switch` statements over finite discriminant types.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

When a `switch` handles a finite set of states, leaving out a case creates a silent branch that will surface later as a bug. Exhaustive switching keeps state changes visible when unions, booleans, or enums evolve.

## Examples

### ✅ Correct

```typescript
type Status = 'idle' | 'loading';

function render(status: Status): number {
  switch (status) {
    case 'idle':
      return 0;
    case 'loading':
      return 1;
  }
}
```

```typescript
function render(flag: boolean): number {
  switch (flag) {
    case true:
      return 1;
    case false:
      return 0;
  }
}
```

### ❌ Incorrect

```typescript
type Status = 'idle' | 'loading' | 'success';

function render(status: Status): number {
  switch (status) {
    case 'idle':
      return 0;
    case 'loading':
      return 1;
  }
  return 2;
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-exhaustive-switch': 'error'
```

## Type Information

This rule relies on typed linting so it can enumerate finite union, enum, and boolean cases from the TypeScript checker.
