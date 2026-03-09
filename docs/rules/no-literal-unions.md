# no-literal-unions

Ban literal union types in favour of enums.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (limited) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Literal union types (`"active" | "inactive"`) scatter magic strings throughout the codebase, are not refactor-safe, and provide no single place to enumerate valid values. TypeScript enums (or `const` objects with `as const`) give the values a canonical home, making them easy to discover, iterate over, and refactor.

## Examples

### ✅ Correct

```typescript
enum Status {
  Active = 'active',
  Inactive = 'inactive',
}

enum Direction {
  North,
  South,
  East,
  West,
}
```

### ❌ Incorrect

```typescript
type Status = 'active' | 'inactive';

type Direction = 'north' | 'south' | 'east' | 'west';

type Size = 'sm' | 'md' | 'lg' | 'xl';
```

## Exceptions

Pure boolean unions (`true | false`) are exempt because they represent the full boolean domain and do not benefit from an enum:

```typescript
// ✅ Allowed — exhaustive boolean union
type Toggle = true | false;
```

## Autofix Behavior

This rule can auto-convert simple string-literal union type aliases to enums.

### Auto-fixable

```typescript
type Status = 'active' | 'inactive';
// becomes:
enum Status { Active = 'active', Inactive = 'inactive' }
```

### Not auto-fixable

- Generic aliases (for example `type Status<T> = 'active' | 'inactive'`)
- Non-alias unions (for example function parameter unions)
- Mixed unions that are not pure string-literal unions

## Configuration

This rule has no options:

```js
'zero-tolerance/no-literal-unions': 'error'
```
