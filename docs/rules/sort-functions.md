# sort-functions

Require top-level function declarations to be sorted alphabetically by name.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`        |
| **Strict**      | `error`       |

## Rationale

Alphabetically ordered top-level functions make a module's API easy to navigate and reduce the chance of duplicate function definitions. The check is case-insensitive and applies to both `function` declarations and `const` variable declarations that initialise arrow functions or function expressions at the top level of the program. Methods, nested functions, and non-const variable declarations are not checked.

Autofix reorders whole declaration blocks when it is safe to do so. It preserves and moves own-line block comments that immediately precede a declaration, as well as same-line trailing comments. Line comments and other ambiguous interstitial comments between declarations are not moved and may cause the rule to report without applying `--fix` to avoid mangling results.

## Examples

### ✅ Correct

```typescript
function buildReport() {
  /* ... */
}
function fetchData() {
  /* ... */
}
function validateInput() {
  /* ... */
}
```

### ❌ Incorrect

```typescript
function validateInput() {
  /* ... */
}
function buildReport() {
  /* ... */
} // should come before validateInput
function fetchData() {
  /* ... */
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/sort-functions': 'error'
```
