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

Literal union types (`"active" | "inactive"`) scatter magic values throughout the codebase, are not refactor-safe, and provide no single place to enumerate valid values. The same problem exists when an exported type alias hides those values behind `typeof` references to same-file literal-valued `const` declarations. TypeScript enums give string and number domains a canonical home, making them easy to discover, iterate over, and refactor.

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

const DEFAULT_STATUS = `default`;

export type StatusName = typeof DEFAULT_STATUS | 'custom';
```

## Exceptions

Pure boolean unions (`true | false`) are exempt because they represent the full boolean domain and do not benefit from an enum:

```typescript
// ✅ Allowed — exhaustive boolean union
type Toggle = true | false;
```

The same exemption applies when an exported alias references same-file boolean literal `const` declarations:

```typescript
const ENABLED = true;
const DISABLED = false;

export type Toggle = typeof ENABLED | typeof DISABLED;
```

## Autofix Behavior

This rule can auto-convert string-only type aliases to enums. That includes direct string literal unions and exported aliases that reference same-file string literal `const` declarations through `typeof`.

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

```typescript
const ACTIVE = 'active';

export type Status = typeof ACTIVE | 'inactive';
// becomes:
export enum Status {
  ACTIVE = 'active',
  Inactive = 'inactive',
}
```

### Not auto-fixable

- Generic aliases (for example `type Status<T> = 'active' | 'inactive'`)
- Non-alias unions (for example function parameter unions)
- Non-exported `typeof` const-reference unions
- Unions that contain number members, boolean members, or unresolved `typeof` members

## Configuration

This rule has no options:

```js
'zero-tolerance/no-literal-unions': 'error'
```
