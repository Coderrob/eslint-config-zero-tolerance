# no-dynamic-import

Ban dynamic `import()` and `require()` calls outside of test files.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Dynamic imports and `require()` calls load modules at runtime rather than at bundle time. This hides dependencies from static analysis tools, prevents tree-shaking, complicates code-splitting strategies, and can introduce subtle load-order bugs. Static `import` declarations at the top of a file are always preferable in application code.

The rule is **automatically skipped** in test files (`*.test.*`, `*.spec.*`, `*.e2e.*`, `*.integration.*`, and files under `__tests__/`), where dynamic loading is sometimes required by test utilities.

## Examples

### ✅ Correct

```typescript
// Static import at the top of the file
import { parseConfig } from './config-parser';

// Allowed in test files: mymodule.test.ts
const module = await import('./module');
import('./module').then((m) => m.default);
const pkg = require('./package');
```

### ❌ Incorrect (in non-test files)

```typescript
// In mymodule.ts
const module = await import('./heavy-module');
import('./heavy-module').then((m) => m.default);

const pkg = require('some-package');
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-dynamic-import': 'error'
```
