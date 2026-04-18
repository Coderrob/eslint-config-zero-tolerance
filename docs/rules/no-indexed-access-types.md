# no-indexed-access-types

Disallow TypeScript indexed access types (`T["key"]`, `T[K]`, `T[number]`).

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Indexed access types expose the internal structure of another type and make refactors brittle. They also hide intent at the usage site because the reader has to mentally resolve the referenced property or element shape.

Prefer extracting and naming the contract you actually want to use.

## Examples

### ✅ Correct

```typescript
type UserName = string;

interface IUserSummary {
  name: UserName;
}
```

### ❌ Incorrect

```typescript
type UserName = IUser['name'];

type Item = (typeof things)['items'][0];
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-indexed-access-types': 'error'
```
