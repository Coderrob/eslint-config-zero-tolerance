# no-unsafe-json-parse

Disallow treating `JSON.parse` results as typed data without validation.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Suggestions** | Yes       |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

`JSON.parse` returns untrusted runtime data. Type assertions and annotations only change TypeScript's view of the value; they do not validate shape or content.

## Examples

### Correct

```typescript
const value: unknown = JSON.parse(input);

const config = ConfigSchema.parse(JSON.parse(input));
```

### Incorrect

```typescript
const config = JSON.parse(input) as Config;

const config: Config = JSON.parse(input);
```

## Configuration

```js
'zero-tolerance/no-unsafe-json-parse': ['error', {
  validatorNames: ['parse', 'safeParse', 'validate', 'assertValid'],
  allowedWrapperNames: ['safeJsonParse', 'parseJson']
}]
```
