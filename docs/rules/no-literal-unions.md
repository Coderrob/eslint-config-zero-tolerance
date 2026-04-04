# no-literal-unions

Ban literal union types in favour of enums.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (limited) |
| **Recommended** | `warn`        |
| **Strict**      | `error`       |

## Rationale

Literal union types (`"active" | "inactive"`) scatter magic strings throughout the codebase, are not refactor-safe, and provide no single place to enumerate valid values. The same problem exists when an exported type alias hides those values behind `typeof` references to literal-valued `const` declarations. TypeScript enums give the values a canonical home, making them easy to discover, iterate over, and refactor.

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

const ACTIVE = 'active';
const INACTIVE = 'inactive';

export type Status = typeof ACTIVE | typeof INACTIVE;
```

## Exceptions

Pure boolean unions (`true | false`) are exempt because they represent the full boolean domain and do not benefit from an enum:

```typescript
// ✅ Allowed — exhaustive boolean union
type Toggle = true | false;
```

## Autofix Behavior

This rule can auto-convert simple string-literal union type aliases, including exported unions of `typeof` references to same-file string literal `const` declarations, to enums.

### Auto-fixable

```typescript
type Status = 'active' | 'inactive';
// becomes:
enum Status {
  Active = 'active',
  Inactive = 'inactive',
}
```

```typescript
const ACTIVE = 'active';
const INACTIVE = 'inactive';

export type Status = typeof ACTIVE | typeof INACTIVE;
// becomes:
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
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
