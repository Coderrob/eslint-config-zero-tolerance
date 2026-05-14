# no-shell-command-construction

Disallow shell command construction through subprocess APIs.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Shell command strings are hard to quote safely and can become OS command injection sinks. Prefer executable plus argument-vector APIs or a reviewed wrapper.

## Examples

### Correct

```typescript
spawn('git', ['status']);

execFile('git', ['status']);
```

### Incorrect

```typescript
exec(command);

spawn(`git ${cmd}`, []);

spawn('git', ['status'], { shell: true });
```

## Configuration

```js
'zero-tolerance/no-shell-command-construction': ['error', {
  approvedWrapperNames: [],
  additionalShellFunctionNames: []
}]
```
