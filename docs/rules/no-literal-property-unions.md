# no-literal-property-unions

Require property literal unions to use named domain types.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Property contracts that use literal unions hide finite or constrained domains inside object shapes. Defining the domain as a named type gives the allowed values a reusable name and keeps interface, type literal, and class property declarations from repeating raw values.

For string and number domains, prefer an enum. For domains TypeScript enums cannot represent, such as bigint values, template-literal patterns, or mixed boolean/string values, use a named domain object, parser, or validator so the property still points at one reusable domain concept.

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

```typescript
class RecordIdKind {
  private constructor(readonly value: bigint) {}

  static readonly Primary = new RecordIdKind(1n);
  static readonly Secondary = new RecordIdKind(2n);
}

interface IRecord {
  idKind: RecordIdKind;
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

Pure boolean property unions (`true | false`) are allowed because they represent the full boolean domain and do not benefit from a named domain. Literal unions mixed with non-boolean members, widened types, or nullish members are still reported.

## Configuration

This rule has no options:

```js
'zero-tolerance/no-literal-property-unions': 'error'
```
