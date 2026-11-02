# require-optional-chaining

Report repeated `&&` guard access for manual review.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

`value && value.member` and `value?.member` can return different values when `value` is falsy but not nullish. For example, `text && text.length` returns an empty string for `text = ''`, while `text?.length` returns zero. Repeated member access can also invoke getters twice. The rule is opt-in and does not autofix.

## Examples

`user && user.profile` is reported when the rule is enabled. `user?.profile` and unrelated logical guards are allowed. Check falsy values and getter behavior before changing a reported expression.

## Configuration

`'zero-tolerance/require-optional-chaining': 'warn'`
