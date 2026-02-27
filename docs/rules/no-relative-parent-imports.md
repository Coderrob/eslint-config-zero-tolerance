# no-relative-parent-imports

**Deprecated**: This rule no longer enforces any restrictions. Imports from parent directories are allowed.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

This rule was previously designed to ban parent-relative imports (`../`) to prevent tight coupling to directory structure. However, imports from parent directories are now considered acceptable.

Re-export restrictions are handled by the `no-re-export` rule.

## Examples

All import patterns are allowed:

```typescript
import { foo } from './sibling';
import { bar } from './child/module';
import { baz } from '../parent'; // Now allowed
import { qux } from '../../grandparent'; // Now allowed
import { pkg } from '@myapp/shared';
import pkg from 'some-npm-package';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-relative-parent-imports': 'error'
```
