# no-dynamic-import

Ban `await import()` and `require()` calls outside of test files.

## Rule Details

| Type    | Fixable | Recommended | Strict |
|---------|---------|-------------|--------|
| problem | No      | warn        | error  |

## Rationale
Dynamic imports and `require()` calls load modules at runtime rather than at bundle time. This hides dependencies from static analysis tools, prevents tree-shaking, complicates code-splitting strategies, and can introduce subtle load-order bugs. Static `import` declarations at the top of a file are always preferable in application code.

The rule is **automatically skipped** in test files (files matching `*.test.{ts,js,tsx,jsx}` or `*.spec.{ts,js,tsx,jsx}`), where dynamic loading is sometimes required by test utilities.

## Examples

### ✅ Correct

```typescript
// Static import at the top of the file
import { parseConfig } from './config-parser';

// Allowed in test files: mymodule.test.ts
const module = await import('./module');
const pkg = require('./package');
```

### ❌ Incorrect (in non-test files)

```typescript
// In mymodule.ts
const module = await import('./heavy-module');

const pkg = require('some-package');
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-dynamic-import': 'error'
```
