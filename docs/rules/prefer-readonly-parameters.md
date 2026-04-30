# prefer-readonly-parameters

Prefer readonly typing for object and array-like function parameters.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`        |
| **Strict**      | `error`       |

## Rationale

Function parameters are inputs. Treating object and array parameters as readonly prevents accidental mutation and preserves referential transparency.

## Examples

### ✅ Correct

```typescript
function format(user: Readonly<User>): string {
  return user.name;
}

function update(setName: Dispatch<SetStateAction<string>>): void {
  setName('ready');
}

class Service {
  constructor(private items: readonly string[]) {}
}
```

### ❌ Incorrect

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

```js
'zero-tolerance/prefer-readonly-parameters': [
  'error',
  {
    ignoredTypeNamePatterns: ['^Dispatch$', '(Callback|Handler)$'],
  },
]
```

| Option                    | Type       | Default                                                                                   | Description                                          |
| ------------------------- | ---------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `ignoredTypeNamePatterns` | `string[]` | `['^Dispatch$', '^Function$', '^RefCallback$', '^VoidFunction$', '(Callback\|Handler)$']` | Type-reference names excluded from readonly wrapping |

## Autofix Notes

Autofix can safely:

- wrap mutable type references as `Readonly<T>`
- rewrite mutable array and tuple annotations to `readonly ...`
- apply those rewrites to constructor parameter properties as well

Autofix skips type references whose terminal name matches `ignoredTypeNamePatterns`. This prevents callable aliases such as React `Dispatch<SetStateAction<T>>` from being rewritten to `Readonly<Dispatch<SetStateAction<T>>>`, which would remove the callable contract.

Autofix intentionally skips structural rewrites such as mutable inline object type literals.
