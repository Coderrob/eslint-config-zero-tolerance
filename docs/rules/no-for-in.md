# no-for-in

Report `for..in` loops, which visit inherited enumerable keys.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

`Object.keys` visits only own enumerable keys, while `for..in` also visits inherited enumerable keys. The rule reports the loop without rewriting it so the author can choose the intended iteration behavior.

## Examples

`for (const key in record) { handle(key); }` is reported. `for (const key of Object.keys(record)) { handle(key); }` is allowed. If inherited keys are required, review the rule setting for that code.

## Configuration

`'zero-tolerance/no-for-in': 'error'`
