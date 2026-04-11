# require-union-type-alias

Require inline union types with multiple type references to be extracted into named type aliases.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Inline union types that combine multiple named type references hide complex domain relationships inside property annotations, function parameters, and return types. Extracting these unions into named type aliases provides:

- **Discoverability**: A named type alias makes the union searchable and identifiable across the codebase.
- **Reusability**: The same union used in multiple locations can reference a single type alias, eliminating duplication.
- **Readability**: Short, descriptive alias names are easier to read than long inline unions.

This rule complements `no-literal-unions` (which handles literal value unions like `"active" | "inactive"`) and `no-literal-property-unions` (which handles literal property unions). It covers the remaining gap: inline unions of named type references.

## Examples

### Correct

```typescript
type ImportSource = DirectoryImportSourceSelection | SourceType | undefined;

interface IConfig {
  sourceType: Readonly<ImportSource>;
}
```

```typescript
type Handler = RequestHandler | ResponseHandler;

function process(handler: Handler): void {
  // ...
}
```

```typescript
// A single type reference with null/undefined is allowed
interface IResult {
  value: MyType | undefined;
}
```

```typescript
// Keyword-only unions are allowed
interface IConfig {
  value: string | number;
}
```

```typescript
// Type alias declarations are the goal state — never flagged
type SourceKind = DirectoryImportSourceSelection | SourceType;
```

### Incorrect

```typescript
interface IConfig {
  sourceType: DirectoryImportSourceSelection | SourceType | undefined;
}
```

```typescript
function process(input: TypeA | TypeB): void {
  // ...
}
```

```typescript
interface IConfig {
  value: Readonly<TypeA | TypeB>;
}
```

```typescript
class Service {
  handler: RequestHandler | ResponseHandler = null!;
}
```

```typescript
const result: SuccessResult | ErrorResult = getResult();
```

## Scope

This rule checks every `TSUnionType` AST node regardless of position — interface properties, type literal properties, class properties, function parameters, return types, variable declarations, and generic type arguments.

A union type is allowed when:

- It is the direct right-hand side of a type alias declaration (`type X = A | B`).
- It contains fewer than two type reference members. Keyword types (`string`, `number`, `boolean`, `undefined`, `null`, `void`, `never`, `unknown`, `any`), literal types (`"foo"`, `42`, `true`), and other non-reference type nodes do not count toward the threshold.
