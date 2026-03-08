# no-query-side-effects

Disallow side effects in query-style functions (`get*`, `is*`, `has*`, `can*`, `should*`).

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Query functions should answer questions without mutating state. Mixing reads and writes increases coupling and makes behavior harder to reason about. This rule enforces `Separate Query from Modifier`.

## Examples

### Correct

```typescript
function getTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}
```

### Incorrect

```typescript
function getTotal(items: number[]): number {
  items.push(0);
  return items.reduce((sum, item) => sum + item, 0);
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-query-side-effects': 'error'
```
