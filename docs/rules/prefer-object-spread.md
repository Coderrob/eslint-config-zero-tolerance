# prefer-object-spread

Report empty-target `Object.assign` calls for manual review.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

`Object.assign({}, source)` and `{ ...source }` can differ. Inlining an object literal getter preserves the getter instead of copying its current value. A source containing an own `__proto__` key can also change the result's prototype under `Object.assign`. The rule is opt-in and does not autofix.

## Examples

`Object.assign({}, source)` is reported when the rule is enabled. `{ ...source }` and `Object.assign(target, source)` are allowed. Review getters, setters, special keys, and any custom `Object.assign` binding before replacing a call.

## Configuration

`'zero-tolerance/prefer-object-spread': 'warn'`
