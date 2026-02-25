# sort-functions

Require top-level function declarations to be sorted alphabetically by name.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

Alphabetically ordered top-level functions make a module's API easy to navigate and reduce the chance of duplicate function definitions. The check is case-insensitive and applies only to `function` declarations at the top level of the program (not methods, nested functions, or arrow functions assigned to variables).

## Examples

### ✅ Correct

```typescript
function buildReport() { /* ... */ }
function fetchData() { /* ... */ }
function validateInput() { /* ... */ }
```

### ❌ Incorrect

```typescript
function validateInput() { /* ... */ }
function buildReport() { /* ... */ }  // should come before validateInput
function fetchData() { /* ... */ }
```

## Configuration

This rule has no options:

```js
'zero-tolerance/sort-functions': 'error'
```
