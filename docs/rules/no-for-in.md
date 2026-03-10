# no-for-in

Disallow `for..in` loops.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

`for..in` iterates enumerable keys across an object's prototype chain, which can introduce surprising behavior. Prefer `Object.keys`, `Object.values`, or `Object.entries` for predictable own-property iteration.

## Examples

### Correct

```typescript
for (const key of Object.keys(record)) {
  handle(key);
}

for (const [key, value] of Object.entries(record)) {
  handlePair(key, value);
}
```

### Incorrect

```typescript
for (const key in record) {
  handle(key);
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-for-in': 'error'
```

## Autofix Notes

Autofix rewrites:

```typescript
for (const key in record) {
  handle(key);
}
```

to:

```typescript
for (const key of Object.keys(record)) {
  handle(key);
}
```
