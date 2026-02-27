# require-optional-chaining

Require optional chaining instead of repeated logical guard access.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Patterns like `obj && obj.value` or `fn && fn()` duplicate the same guard expression and make code harder to read. Optional chaining expresses the same intent directly in one expression and removes repetition.

## Examples

### ✅ Correct

```typescript
const profile = user?.profile;
const result = fn?.();
const name = account?.owner?.name;
```

### ❌ Incorrect

```typescript
const profile = user && user.profile;
const result = fn && fn();
const name = account.owner && account.owner.name;
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-optional-chaining': 'error'
```
