# no-relative-parent-imports

Ban imports and re-exports that use `../` to traverse into a parent directory.

## Rule Details

| | |
|---|---|
| **Type** | `problem` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

Parent-relative imports (`../`) tightly couple a module to its position in the directory tree. Moving a file requires updating every `../` import path in it and in anything that imported it. Using absolute paths (via TypeScript path aliases or package imports) or sibling imports makes modules more portable and refactoring safer.

## Examples

### ✅ Correct

```typescript
import { foo } from './sibling';
import { bar } from './child/module';
import { baz } from '@myapp/shared';
import pkg from 'some-npm-package';
```

### ❌ Incorrect

```typescript
import { foo } from '../parent';
import { bar } from '../../grandparent/utils';

export { baz } from '../other-module';
export * from '../../root';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-relative-parent-imports': 'error'
```
