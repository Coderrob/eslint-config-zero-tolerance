# no-test-interface-declaration

Disallow `interface` declarations in test files; import production types instead.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Declaring an interface inside a test file is almost always a sign that the production code is not exporting a proper type contract. When a test author creates a local interface to type mock objects or fixtures, that type drifts independently from the real production shape. If the production type changes, the test's copy won't break, silently hiding regressions.

The correct fix is to define the interface in the production module and import it in the test.

## Examples

### ✅ Correct

```typescript
// user.ts (production)
export interface IUser {
  name: string;
  email: string;
}

// user.test.ts
import type { IUser } from './user';

const mockUser: IUser = { name: 'Alice', email: 'alice@example.com' };
```

### ❌ Incorrect

```typescript
// user.test.ts
interface IUser {
  name: string;
  email: string;
}

const mockUser: IUser = { name: 'Alice', email: 'alice@example.com' };
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-test-interface-declaration': 'error'
```
