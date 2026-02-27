# no-banned-types

Ban `ReturnType` utility type and TypeScript indexed access types (`T["key"]`).

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `problem`    |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`ReturnType<typeof fn>` couples callers to the internal return type of a function rather than an explicit, named contract. When the function's return type changes, the inferred type silently changes everywhere it is used, bypassing deliberate type design.

Indexed access types (`T["key"]`) expose internal structure, making refactoring brittle and obscuring intent. Prefer explicit type aliases or interface members instead.

## Examples

### ✅ Correct

```typescript
// Declare an explicit return type
type FetchResult = { data: IUser; status: number };

async function fetchUser(): Promise<FetchResult> {
  // ...
}
```

### ❌ Incorrect

```typescript
// ReturnType couples callers to implementation details
type MyReturnType = ReturnType<typeof fetchUser>;

// Indexed access exposes internal structure
type UserName = IUser['name'];
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-banned-types': 'error'
```
