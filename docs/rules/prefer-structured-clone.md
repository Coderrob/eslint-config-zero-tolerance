# prefer-structured-clone

Report `JSON.parse(JSON.stringify(value))` for manual review.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

JSON cloning and `structuredClone` have different value semantics. JSON cloning drops undefined object properties and serializes dates as strings; structured cloning retains undefined properties and Date values. JSON serialization can also invoke `toJSON`. The rule is opt-in and does not autofix.

## Examples

`JSON.parse(JSON.stringify(value))` is reported when the rule is enabled. `structuredClone(value)` and ordinary `JSON.parse(serializedValue)` are allowed. Review the data shape and required output before replacing the cloning operation.

## Configuration

`'zero-tolerance/prefer-structured-clone': 'warn'`
