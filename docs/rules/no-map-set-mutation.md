# no-map-set-mutation

Disallow direct `Map` and `Set` mutation methods.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Mutable `Map` and `Set` instances are the same shortcut as mutating arrays and objects in place. Rebuilding a collection makes state transitions explicit and easier to reason about.

## Examples

### ✅ Correct

```typescript
const cache = new Map<string, number>();
const answer = cache.get('answer');

const ids = new Set<string>();
const hasId = ids.has('abc');
```

### ❌ Incorrect

```typescript
const cache = new Map<string, number>();
cache.set('answer', 42);

const ids = new Set<string>();
ids.add('abc');
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-map-set-mutation': 'error'
```

## Type Information

This rule relies on typed linting so it can distinguish real `Map` and `Set` instances from unrelated objects that happen to expose similarly named methods.
