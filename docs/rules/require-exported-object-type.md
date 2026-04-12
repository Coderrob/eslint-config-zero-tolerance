# require-exported-object-type

Require exported object constants to declare an explicit type annotation.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Exported object constants become part of a module's public contract. Requiring an explicit annotation prevents large inferred structural types from leaking through exports and keeps the intended shape readable even when the value is wrapped in `Object.freeze(...)`.

## Examples

### ✅ Correct

```typescript
export const StatusMap: Readonly<Record<string, string>> = Object.freeze({
  Active: 'active',
  Inactive: 'inactive',
});
```

```typescript
type StatusLookup = Record<string, string>;

const StatusMap: StatusLookup = {
  Active: 'active',
};

export { StatusMap };
```

### ❌ Incorrect

```typescript
export const StatusMap = Object.freeze({
  Active: 'active',
  Inactive: 'inactive',
});
```

```typescript
const StatusMap = {
  Active: 'active',
};

export { StatusMap };
```

The rule only applies when the exported `const` initializer is an object literal or `Object.freeze({ ... })`. Calls such as `Object.freeze()` or `Object.freeze(...values)` are ignored because they do not expose a direct frozen object literal shape.

## Configuration

This rule has no options:

```js
'zero-tolerance/require-exported-object-type': 'error'
```
