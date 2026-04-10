# no-literal-property-unions

Require property literal unions to use enums.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Property contracts that use literal unions hide enum-like domains inside object shapes. Defining the domain as an enum gives the allowed values a reusable name and keeps interface, type literal, and class property declarations from repeating raw values.

## Examples

### Correct

```typescript
enum SearchMode {
  TreeSitter = 'tree-sitter',
  RipgrepPrefilter = 'ripgrep-prefilter',
  TextHint = 'text-hint',
}

export interface IAstLangSearchMatch {
  path: string;
  line: number;
  column: number;
  text: string;
  matchedTerm: string;
  mode: SearchMode;
}
```

```typescript
enum ExitCode {
  Success = 0,
  Failure = 1,
}

interface IProcessResult {
  exitCode: ExitCode;
}
```

### Incorrect

```typescript
export interface IAstLangSearchMatch {
  path: string;
  line: number;
  column: number;
  text: string;
  matchedTerm: string;
  mode: 'tree-sitter' | 'ripgrep-prefilter' | 'text-hint';
}
```

```typescript
interface IProcessResult {
  exitCode: 0 | 1;
}
```

```typescript
interface IRecord {
  idKind: 1n | 2n;
}
```

```typescript
type SearchMatch = {
  mode: 'tree-sitter' | 'text-hint' | undefined;
};
```

```typescript
interface ISearchMatch {
  slug: `a-${string}` | `b-${string}`;
}
```

```typescript
interface ISearchMatch {
  mode: 'tree-sitter' | string;
}
```

```typescript
interface ISearchMatch {
  value: true | 'yes';
}
```

## Scope

This rule checks interface property signatures, type literal property signatures, class properties, and abstract class properties. It ignores function parameters and type aliases because those are covered by `no-literal-unions`.

Pure boolean property unions (`true | false`) are allowed because they represent the full boolean domain and do not benefit from an enum. Literal unions mixed with non-boolean members, widened types, or nullish members are still reported.

## Configuration

This rule has no options:

```js
'zero-tolerance/no-literal-property-unions': 'error'
```
