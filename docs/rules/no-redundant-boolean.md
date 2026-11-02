# no-redundant-boolean

Simplify comparisons and ternaries only when their boolean result is preserved.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | Yes (`code`) |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

A strict comparison such as `value === true` cannot safely become `value` unless the operand is known to be boolean: `1 === true` is false, while `1` is truthy. This rule only simplifies comparisons whose operand is syntactically boolean. A ternary such as `condition ? true : false` becomes `!!condition` when the condition's type is unknown, preserving the boolean result. Removing `!!` keeps the inner expression parenthesized so surrounding arithmetic and unary operators retain their precedence. Expressions containing comments are left unchanged.

## Examples

`(value > 0) === true` is reported and fixed to `value > 0`. `condition ? true : false` is fixed to `!!condition`. `1 + !!(value > 0)` is fixed to `1 + (value > 0)`. `value === true` is allowed when `value` is not syntactically known to be boolean.

## Configuration

`'zero-tolerance/no-redundant-boolean': 'error'`
