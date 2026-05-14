# require-interface-prefix

Enforce that TypeScript interface names start with `I` (capital letter) followed by an uppercase character.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Prefixing interface names with `I` makes it immediately clear in code that a type is an interface rather than a class or type alias. This convention improves readability, especially in large codebases where interfaces are heavily used.

## Autofix

The fixer prefixes capitalized interface names and same-file type references when the generated name does not collide with an existing top-level interface or type alias. Lowercase names and collision cases remain report-only.

## Examples

### ✅ Correct

```typescript
interface IUser {
  name: string;
  email: string;
}

interface IRepository<T> {
  findById(id: string): Promise<T>;
}
```

### ❌ Incorrect

```typescript
interface User {
  name: string;
}

interface userProfile {
  age: number;
}
```

## Configuration

This rule has no options. Enable it in your ESLint config:

```js
'zero-tolerance/require-interface-prefix': 'error'
```
