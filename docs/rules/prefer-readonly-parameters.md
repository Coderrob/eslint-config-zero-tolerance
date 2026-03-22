# prefer-readonly-parameters

Prefer readonly typing for object and array-like function parameters.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Function parameters are inputs. Treating object and array parameters as readonly prevents accidental mutation and preserves referential transparency.

## Examples

### Correct

```typescript
function format(user: Readonly<User>): string {
  return user.name;
}

class Service {
  constructor(private items: readonly string[]) {}
}
```

### Incorrect

```typescript
function format(user: User): string {
  return user.name;
}

class Service {
  constructor(private items: string[]) {}
}
```

## Configuration

```js
'zero-tolerance/prefer-readonly-parameters': 'error'
```

## Autofix Notes

Autofix can safely:

- wrap mutable type references as `Readonly<T>`
- rewrite mutable array and tuple annotations to `readonly ...`
- apply those rewrites to constructor parameter properties as well

Autofix intentionally skips structural rewrites such as mutable inline object type literals.
