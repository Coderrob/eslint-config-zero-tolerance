# no-placeholder-implementation

Disallow placeholder, stub, TODO, and not implemented production code.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Placeholder implementations often compile while silently dropping behavior. Production code should either implement the path or fail through an explicit reviewed design.

## Examples

### Correct

```typescript
function find(value: string): string | null {
  if (value.length === 0) {
    return null;
  }
  return value;
}
```

### Incorrect

```typescript
function load(): never {
  throw new Error('TODO');
}

function build(): object {
  return {};
}
```

## Configuration

```js
'zero-tolerance/no-placeholder-implementation': ['error', {
  checkComments: true,
  checkTests: false,
  allowedTerms: []
}]
```
