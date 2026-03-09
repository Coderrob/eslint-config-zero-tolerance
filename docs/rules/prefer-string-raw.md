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

### Correct

```typescript
const path = String.raw`C:\Users\dev\repo`;
const regexSource = String.raw`\d+\w+`;
```

### Incorrect

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

Autofix rewrites eligible string literals to `String.raw\`\`` form. It intentionally skips unsafe cases such as literals containing template interpolation markers (for example, `${...}`) or backticks.
