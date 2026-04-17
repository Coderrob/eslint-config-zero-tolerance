# prefer-structured-clone

Prefer `structuredClone(...)` over `JSON.parse(JSON.stringify(...))` for deep cloning.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`        |
| **Strict**      | `error`       |

## Rationale

`JSON.parse(JSON.stringify(...))` is a brittle deep-clone pattern. It silently drops values that JSON cannot represent, strips prototypes, and makes the intent harder to read. `structuredClone(...)` is the direct platform API for cloning structured data and communicates that intent clearly.

## Examples

### ✅ Correct

```typescript
const clone = structuredClone(value);

const payload = structuredClone(source.payload);

const parsed = JSON.parse(serializedValue);

const revived = JSON.parse(JSON.stringify(value), reviveValue);
```

### ❌ Incorrect

```typescript
const clone = JSON.parse(JSON.stringify(value));

const payload = JSON.parse(JSON.stringify(source.payload));

return JSON.parse(JSON.stringify(buildPayload()));
```

## Configuration

This rule has no options:

```js
'zero-tolerance/prefer-structured-clone': 'error'
```

## Autofix Notes

The autofix rewrites the direct deep-clone pattern to `structuredClone(...)` and preserves outer call type arguments when they are present:

- `JSON.parse(JSON.stringify(value))` -> `structuredClone(value)`
- `JSON.parse<MyType>(JSON.stringify(value))` -> `structuredClone<MyType>(value)`

Calls with extra `JSON.parse(...)` or `JSON.stringify(...)` arguments are intentionally ignored.
