# prefer-object-spread

Enforce object spread syntax instead of `Object.assign` with an empty object literal as the first argument.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`        |
| **Strict**      | `error`       |

## Rationale

`Object.assign({}, ...)` is functionally equivalent to object spread (`{ ... }`) when the first argument is an empty object literal. The spread syntax is more concise, more readable, and avoids an unnecessary function call. This aligns with SonarQube rule `typescript:S6661`.

## Examples

### ✅ Correct

```typescript
const result = { ...foo };

const merged = { ...defaults, ...overrides };

const extended = { ...foo, a: 1 };

// Object.assign with a non-empty first argument is allowed
const target = Object.assign(existingObj, { a: 1 });
```

### ❌ Incorrect

```typescript
const result = Object.assign({}, source);

const merged = Object.assign({}, foo, bar);

const enriched = Object.assign({}, step.aiEnrichment, enrichment);

const extended = Object.assign({}, foo, { a: 1 });
```

## Configuration

This rule has no options:

```js
'zero-tolerance/prefer-object-spread': 'error'
```

## Autofix Notes

The autofix converts `Object.assign({}, ...)` calls into object spread syntax:

- Variable and expression arguments are spread: `Object.assign({}, foo)` → `{ ...foo }`
- Object literal arguments are inlined: `Object.assign({}, { a: 1 })` → `{ a: 1 }`
- Mixed arguments are handled correctly: `Object.assign({}, { x: 1 }, bar)` → `{ x: 1, ...bar }`
