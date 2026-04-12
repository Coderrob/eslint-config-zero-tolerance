# no-destructured-parameter-type-literal

Disallow inline object type literals on destructured parameters.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Destructured parameters already hide the original object shape at the call site. Adding an inline object type literal to the same parameter makes the contract harder to reuse, harder to scan, and harder to name in documentation. Requiring a named type keeps the contract explicit and reusable.

## Examples

### ✅ Correct

```typescript
interface IUiActions {
  readonly set: UiStateSetter;
}

function update({ set }: IUiActions): void {
  set('ready');
}

type UiActions = Readonly<{ readonly set: UiStateSetter }>;

const updateLater = ({ set }: UiActions): void => {
  set('later');
};
```

### ❌ Incorrect

```typescript
function update({ set }: Readonly<{ set: UiStateSetter }>): void {
  set('ready');
}

const updateLater = ({ set }: { readonly set: UiStateSetter }): void => {
  set('later');
};
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-destructured-parameter-type-literal': 'error'
```
