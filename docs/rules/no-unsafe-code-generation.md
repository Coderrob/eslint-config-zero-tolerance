# no-unsafe-code-generation

Disallow eval, Function constructors, string timers, and Node vm execution APIs.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

Dynamic code execution expands injection risk and defeats static analysis. Prefer explicit functions, parsers, or constrained interpreters.

## Examples

### Correct

```typescript
setTimeout(() => run(), 100);

const value = parser.parse(source);
```

### Incorrect

```typescript
eval(source);

const fn = new Function(source);

setTimeout('run()', 100);

setInterval(`run(${value})`, 100);
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-unsafe-code-generation': 'error'
```

Direct timers are checked only when they resolve to unshadowed globals. Known global-object forms such as `globalThis.setTimeout(...)` are also checked, while arbitrary methods such as `scheduler.setTimeout(...)` are left alone.
