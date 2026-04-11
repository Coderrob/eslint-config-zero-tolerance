# no-fetch-in-tests

Disallow `fetch` usage in test files.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

Direct HTTP calls in tests create network-dependent failures and blur the boundary between unit, integration, and end-to-end testing. Prefer injecting a client, using a mock transport, or keeping real HTTP behind explicit integration-test helpers.

This rule is opt-in and disabled by default in the built-in presets. It only runs in recognized test files: `*.test.*`, `*.spec.*`, `*.e2e.*`, `*.integration.*`, and files under `__tests__/`.

## Examples

### Correct

```typescript
const client = createMockClient({
  '/users/1': { id: '1', name: 'Ada' },
});

await loadUser(client, '1');
```

### Incorrect

```typescript
await fetch('/users/1');
await globalThis.fetch('/users/1');
await window.fetch('/users/1');
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-fetch-in-tests': 'error'
```
