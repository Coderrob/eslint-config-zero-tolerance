# require-jsdoc-functions

Require JSDoc documentation comments on all function-like constructs outside of test files, including declarations, function expressions, arrow functions, class methods, static methods, class field functions, and object methods.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`        |
| **Strict**      | `error`       |

## Rationale

JSDoc comments are essential for self-documenting code and support IDE tooling, generated API documentation, and clear intent communication to future maintainers. This rule is automatically skipped in test files (`.test.*` / `.spec.*`).

## Examples

### Correct

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

/**
 * Returns a normalized display label.
 */
export const getLabel = (input: string): string => input.trim();

class DedupeFactory {
  /**
   * Creates the dedupe service instance.
   */
  static createDedupeService(): DedupeService {
    return new DedupeService();
  }
}
```

### Incorrect

```typescript
async function fetchUser(id: string): Promise<IUser> {
  return db.users.findById(id);
}

const isValidEmail = (email: string): boolean => /^[^@]+@[^@]+$/.test(email);

class DedupeFactory {
  static createDedupeService(): DedupeService {
    return new DedupeService();
  }
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-jsdoc-functions': 'error'
```

## Autofix Notes

Autofix can:

- insert a missing JSDoc block for standalone function declarations/expressions and members
- append missing `@param`, `@returns`, and `@throws` tags to existing JSDoc blocks

Autofix intentionally skips unsafe insertion targets such as inline declarations and multi-declarator variable statements.

### Test files are exempt

Functions inside files matching `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js` (and their JSX equivalents) are not checked.
