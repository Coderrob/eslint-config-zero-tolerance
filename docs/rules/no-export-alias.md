# no-export-alias

Prevent use of aliases in `export` statements; export values under their original names.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Export aliases (`export { foo as bar }`) create a disconnect between the internal name of a value and the name that consumers use. This makes it harder to search for a symbol across the codebase and increases the chance of confusion. Export the value directly, or rename it at the declaration site.

## Autofix

This rule intentionally does not autofix true public aliases such as `export { foo as bar }`, because correcting them safely requires a naming decision. Redundant same-name exports are already valid syntax and are not reported as aliases.

## Examples

### ✅ Correct

```typescript
export { fetchUser };
export { createOrder };
export { validateSchema };
```

### ❌ Incorrect

```typescript
export { fetchUser as getUser };
export { createOrder as placeOrder };
export { validateSchema as checkSchema };
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-export-alias': 'error'
```
