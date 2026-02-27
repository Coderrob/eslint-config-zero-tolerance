# sort-functions

Require top-level function declarations to be sorted alphabetically by name.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Alphabetically ordered top-level functions make a module's API easy to navigate and reduce the chance of duplicate function definitions. The check is case-insensitive and applies to both `function` declarations and `const` variable declarations that initialise arrow functions or function expressions at the top level of the program. Methods, nested functions, and non-const variable declarations are not checked.

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
