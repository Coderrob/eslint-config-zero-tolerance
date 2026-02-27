# require-jsdoc-functions

Require JSDoc documentation comments on all function declarations, function expressions, and arrow functions outside of test files.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

JSDoc comments are essential for self-documenting code and support IDE tooling, generated API documentation, and clear intent communication to future maintainers. This rule is automatically skipped in test files (`.test.*` / `.spec.*`).

## Examples

### ✅ Correct

```typescript
/**
 * Fetches a user record by ID.
 */
async function fetchUser(id: string): Promise<IUser> {
  return db.users.findById(id);
}

/**
 * Validates that the given email address is well-formed.
 */
const isValidEmail = (email: string): boolean => /^[^@]+@[^@]+$/.test(email);
```

### ❌ Incorrect

```typescript
async function fetchUser(id: string): Promise<IUser> {
  return db.users.findById(id);
}

const isValidEmail = (email: string): boolean => /^[^@]+@[^@]+$/.test(email);
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-jsdoc-functions': 'error'
```

### Test files are exempt

Functions inside files matching `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js` (and their JSX equivalents) are not checked.
