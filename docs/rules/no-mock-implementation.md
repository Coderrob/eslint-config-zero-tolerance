# no-mock-implementation

Prohibit persistent mock setup methods; use their `Once` variants to prevent test bleeds.

## Rule Details

|                 |              |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

`mockImplementation`, `mockReturnValue`, `mockResolvedValue`, and `mockRejectedValue` configure a mock _persistently_ for the lifetime of the test suite (or until manually reset). This means a mock configured in one test silently bleeds into subsequent tests, leading to hard-to-diagnose ordering-dependent failures.

The `Once` variants (`mockImplementationOnce`, `mockReturnValueOnce`, `mockResolvedValueOnce`, `mockRejectedValueOnce`) only apply for a single call and then revert. This eliminates the source of test bleeds entirely.

| Banned               | Replacement              |
| -------------------- | ------------------------ |
| `mockImplementation` | `mockImplementationOnce` |
| `mockReturnValue`    | `mockReturnValueOnce`    |
| `mockResolvedValue`  | `mockResolvedValueOnce`  |
| `mockRejectedValue`  | `mockRejectedValueOnce`  |

## Examples

### ✅ Correct

```typescript
jest.fn().mockImplementationOnce(() => 'value');
jest.fn().mockReturnValueOnce(42);
jest.fn().mockResolvedValueOnce({ data: 'ok' });
jest.fn().mockRejectedValueOnce(new Error('failed'));
```

### ❌ Incorrect

```typescript
jest.fn().mockImplementation(() => 'value');
jest.fn().mockReturnValue(42);
jest.fn().mockResolvedValue({ data: 'ok' });
jest.fn().mockRejectedValue(new Error('failed'));
```

## Configuration

This rule has no options:

```js
'zero-tolerance/no-mock-implementation': 'error'
```
