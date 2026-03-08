# no-type-assertion

Prevent use of TypeScript type assertions (`as` and angle-bracket assertions) outside of test files.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Type assertions tell the TypeScript compiler to trust you over the type system. They are a common source of runtime errors because they bypass inference and structural checks. In production code, explicit type guards, generic functions, or proper data modelling should be used instead.

The rule allows `as unknown` and `<unknown>` in test files (`.test.*`, `.spec.*`, `.e2e.*`, `.integration.*`, and files under `__tests__/`) because this pattern is common in test utilities and rule tester setups.

## Examples

### ✅ Correct

```typescript
// Use a type guard instead
function isUser(value: unknown): value is IUser {
  return typeof value === 'object' && value !== null && 'name' in value && 'email' in value;
}

// Generic function with a constraint
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

### ❌ Incorrect

```typescript
const user = response.data as IUser;

const element = document.querySelector('#app') as HTMLDivElement;

const value = <MyType>getValue();
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-type-assertion': 'error'
```
