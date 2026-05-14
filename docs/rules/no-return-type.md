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

## Suggestions

When `ReturnType<typeof fn>` references a same-file function declaration or const function with an explicit return annotation, the rule suggests replacing `ReturnType<typeof fn>` with that annotation text. Other cases remain report-only.

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
