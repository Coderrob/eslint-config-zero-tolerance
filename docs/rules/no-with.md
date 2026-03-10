# no-with

Disallow `with` statements.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

`with` changes scope resolution rules in ways that are hard to reason about and optimize. It is disallowed in strict mode and should be replaced with explicit object property access.

## Examples

### Correct

```typescript
const fullName = person.firstName + person.lastName;
```

### Incorrect

```typescript
with (person) {
  fullName = firstName + lastName;
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-with': 'error'
```
