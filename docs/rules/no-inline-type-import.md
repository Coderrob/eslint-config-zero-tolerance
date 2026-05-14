# no-inline-type-import

Disallow TypeScript inline type imports using `import("...")`.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | Yes       |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Inline type import queries make dependencies harder to scan and enforce inconsistently across files. Requiring top-level `import type` statements keeps imports explicit, grouped, and easier to maintain.

## Autofix

Simple `import("module").Name` references are fixed by replacing the inline reference with `Name` and adding or reusing a top-level `import type` declaration. The fixer refuses cases where the generated type name would collide with an existing top-level binding.

## Examples

### ✅ Correct

```typescript
import type { PipelineContext } from '../types/pipeline';
import type { Program, SourceFile, TypeChecker } from 'typescript';

interface ISourceLoadResult {
  readonly context: PipelineContext;
  readonly checker: TypeChecker;
  readonly options: Program;
  readonly sourceFiles: readonly SourceFile[];
}
```

### ❌ Incorrect

```typescript
interface ISourceLoadResult {
  readonly context: import('../types/pipeline').PipelineContext;
  readonly checker: import('typescript').TypeChecker;
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-inline-type-import': 'error'
```
