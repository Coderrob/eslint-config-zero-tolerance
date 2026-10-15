# prefer-string-raw

Prefer `String.raw` for string literals that contain escaped backslashes.

This mirrors Sonar rule `typescript:S7780`.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `warn`        |
| **Strict**      | `error`       |

## Rationale

Strings containing escaped backslashes are harder to read and easier to get wrong. Using `String.raw` avoids double escaping and keeps path-like and regex-source text easier to maintain.

## Examples

### ✅ Correct

```typescript
const path = String.raw`C:\Users\dev\repo`;
const regexSource = String.raw`\d+\w+`;
```

### ❌ Incorrect

```typescript
const path = 'C:\\Users\\dev\\repo';
const regexSource = '\\d+\\w+';
```

## Configuration

This rule has no options:

```js
'zero-tolerance/prefer-string-raw': 'error'
```

## Autofix Notes

Autofix rewrites only eligible string literals to `String.raw\`\`` form after verifying that the resulting template has the same runtime value. Regex literals are never considered; regex-source strings with redundant backslash escaping are fixed only when their value is preserved.

The rule intentionally skips grammar-sensitive positions such as directives, import/export sources, non-computed property keys, JSX attributes, inline Jest snapshots, and TypeScript literal contexts. It also skips mixed runtime escapes, trailing backslashes, multiline strings, template interpolation markers such as `${...}`, and backticks.
