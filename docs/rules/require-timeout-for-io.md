# require-timeout-for-io

Require supported timeout or cancellation options on external IO calls.

Type: problem. No automatic fix.

## What it checks

Looks for timeout or cancellation options in the argument accepted by each API. A timeout in request data does not count. Recognizes supported imports and aliases, including `import { default as client }`, optional calls, and static computed API names. A local binding that replaces a conventional client name is not assumed to be that client.

| API                                                           | Accepted options                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| fetch, node-fetch, undici.fetch                               | signal in argument 2.                                                        |
| axios.get/delete/head/options                                 | timeout or signal in argument 2.                                             |
| axios.post/put/patch and Form variants                        | timeout or signal in argument 3; argument 2 is request data.                 |
| axios(config), axios.request(config)                          | timeout or signal in the config object.                                      |
| got                                                           | Timeout phase object or signal; supports options-only and URL/options calls. |
| request                                                       | timeout in options; signal is not supported.                                 |
| ky                                                            | timeout or signal in argument 2.                                             |
| superagent                                                    | Immediate .timeout(number) or .timeout({ response, deadline }).              |
| child_process exec/execSync                                   | timeout in argument 2; async exec also accepts signal.                       |
| child_process spawn/execFile/fork and supported Sync variants | timeout in options after optional argv; async variants also accept signal.   |

## Examples

```typescript
axios.post(url, { timeout: 5000 }); // Reported: timeout is request data.
axios.post(url, body, { timeout: 5 * 1000 }); // Allowed.
fetch(url, { signal: controller.signal }); // Allowed.
fetch(url, { timeout: 5000 }); // Reported: fetch requires a signal.
```

## Timeout values and local options

Accepts positive finite numbers, supported numeric arithmetic, and fallbacks such as configuredTimeout ?? 5000. Rejects known disabled values, including zero, negative numbers, null, false, global undefined, NaN, and Infinity. Local declarations with those names are checked using their own bindings.

Local aliases are followed when their values have not been reassigned. TypeScript assertions preserve the underlying value. Cycles stop safely. Object spreads and duplicate keys follow override order; unknown overrides and directly modified options are not trusted. This includes writes, updates, and deletes through TypeScript assertions around the options object. Reused expression branches are evaluated once per timeout check, so deep alias graphs do not cause repeated expansion.

## Options

| Option                      | Default | Meaning                                                       |
| --------------------------- | ------- | ------------------------------------------------------------- |
| `approvedWrapperNames`      | []      | Trusted wrapper names that enforce timeout or cancellation.   |
| `additionalIoFunctionNames` | []      | Extra function names to check; options must be in argument 2. |
| `checkTests`                | false   | Apply the rule to recognized test files as well.              |

```js
'zero-tolerance/require-timeout-for-io': ['error', {
  additionalIoFunctionNames: ['loadRemote'],
  checkTests: true,
}]
```

## Limits

An accepted runtime value does not prove that a timeout is positive or that a signal will abort. The rule does not execute expressions or track all changes made through aliases or other functions.

Client-instance defaults, indirect factories, CommonJS aliases, Request objects with embedded signals, and non-immediate timeout chains are not resolved. For these patterns, use a reviewed wrapper that enforces cancellation and configure its name as trusted.
