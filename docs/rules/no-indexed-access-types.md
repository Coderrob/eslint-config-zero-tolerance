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

## Suggestions

By default the rule reports only. When configured with `aliasNamePattern`, it can suggest extracting the indexed access to a generated top-level type alias and replacing the usage with that alias. Supported placeholders are `{object}`, `{property}`, and `{index}`; generated names are sanitized to PascalCase and refused when they collide with an existing top-level binding.

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

This rule accepts an optional alias name pattern for suggestions:

```js
'zero-tolerance/no-indexed-access-types': ['error', { aliasNamePattern: '{object}{property}' }]
```
