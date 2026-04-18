# no-return-type

Disallow TypeScript `ReturnType` utility usage.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

`ReturnType<typeof fn>` couples consumers to a function's implementation details instead of an explicit, named contract. When the function's return type changes, dependent types change silently too.

Prefer declaring a named result type and making that contract explicit.

## Examples

### ✅ Correct

```typescript
type FetchResult = { data: IUser; status: number };

async function fetchUser(): Promise<FetchResult> {
  // ...
}
```

### ❌ Incorrect

```typescript
type FetchUserResult = ReturnType<typeof fetchUser>;
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-return-type': 'error'
```
