# require-timeout-for-io

Require timeout or cancellation options for external IO calls.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Network calls, HTTP clients, and subprocesses can hang indefinitely without timeout or abort handling. Every IO boundary should expose cancellation.

## Examples

### Correct

```typescript
fetch(url, { signal });

axios.get(url, { timeout: 5000 });

spawn('git', ['status'], { timeout: 5000 });
```

### Incorrect

```typescript
fetch(url);

axios.get(url);

axios.get(url, { timeout: 0 });

fetch(url, { signal: undefined });

spawn('git', ['status']);
```

## Configuration

```js
'zero-tolerance/require-timeout-for-io': ['error', {
  approvedWrapperNames: [],
  checkTests: false,
  additionalIoFunctionNames: []
}]
```

Cancellation must be active: positive numeric or runtime timeout expressions and non-null signals are accepted. Disabled forms such as `timeout: 0`, `signal: undefined`, and an empty `.timeout()` chain are reported.
