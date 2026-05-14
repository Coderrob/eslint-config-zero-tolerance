# require-barrel-relative-exports

Require barrel re-export declarations to use current-directory descendant paths.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Barrel files (`index.*`) should aggregate modules that live under the same directory tree. Re-export paths such as `../foo`, `@/foo`, `package-name`, or `/root/foo` make the barrel depend on code outside its local subtree and blur what that barrel actually owns.

This rule applies only to re-export declarations inside barrel files, including:

- `export { foo } from '...'`
- `export type { Foo } from '...'`
- `export * from '...'`
- `export * as ns from '...'`

Allowed barrel re-export paths must start with `./` and point at a descendant module such as `./foo` or `./feature/foo`.

## Autofix

Bare same-directory exports such as `export { foo } from 'foo'` are fixed to `./foo` only when the sibling file or directory can be verified from the linted filename. Package, alias, absolute, parent, virtual, and unverified paths remain report-only.

## Examples

### ✅ Correct

```typescript
// index.ts
export { parseUser } from './parse-user';
export * from './feature/utils';
export type { User } from './types/user';
export * as formatters from './formatters';
```

### ❌ Incorrect

```typescript
// index.ts
export { parseUser } from '../parse-user';
export type { User } from '@/types/user';
export * from 'shared/utils';
export * as rootValue from '/root/value';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-barrel-relative-exports': 'error'
```

## Notes

- The rule applies only to single-extension barrel files such as `index.ts`, `index.js`, and `index.mts`.
- Double-extension files such as `index.d.ts`, `index.test.ts`, and `index.spec.js` are ignored.
- Local export declarations with no `from` source are not checked by this rule; `require-clean-barrel` handles those barrel-shape constraints.
