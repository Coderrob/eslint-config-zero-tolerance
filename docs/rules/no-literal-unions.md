# no-literal-unions

Ban literal union types in favour of enums.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
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

## Configuration

This rule has no options:

```js
'zero-tolerance/no-literal-unions': 'error'
```
