# prefer-nullish-coalescing

Prefer `??` for ternaries that repeat a locally bound identifier after a loose nullish check.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`value != null ? value : fallback` can be shortened to a nullish coalescing expression when `value` is a declared local binding. The fixer parenthesizes the fallback to preserve the grouping of logical and conditional expressions. The rule skips unbound identifiers, which may resolve to global accessors. Member access, calls, and expressions containing comments are also left unchanged because rewriting them could change behavior or discard comments.

## Examples

For a locally declared `value`, `value != null ? value : fallback && ready` is reported and fixed to `value ?? (fallback && ready)`. Repeated member access, calls, unbound identifiers, and commented expressions are allowed.

## Configuration

`'zero-tolerance/prefer-nullish-coalescing': 'error'`
