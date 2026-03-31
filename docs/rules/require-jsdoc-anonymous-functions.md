# require-jsdoc-anonymous-functions

Require JSDoc documentation comments on anonymous function-like constructs outside of test files, such as anonymous default exports, computed methods without identifier keys, and inline anonymous callbacks. Anonymous callbacks passed to well-known test APIs such as `describe`, `it`, `test`, `beforeEach`, and `afterAll` are excluded.

## Rule Details

| Property        | Value         |
| --------------- | ------------- |
| **Type**        | `suggestion`  |
| **Fixable**     | Yes (`--fix`) |
| **Recommended** | `off`         |
| **Strict**      | `warn`        |

## Rationale

Anonymous functions hide intent at the callsite and can make behavior harder to understand in larger codebases. Requiring JSDoc on anonymous function-like constructs makes their purpose explicit and improves generated documentation quality.

This rule is automatically skipped in test files (`.test.*` / `.spec.*`). It also skips anonymous callbacks passed to common test framework APIs and hook helpers, including chained forms such as `describe.only(...)`, `test.skip.each(...)`, and `test.beforeEach(...)`.

## Examples

### Correct

```typescript
/**
 * Creates the default app configuration.
 */
export default function () {
  return { retries: 3 };
}

class Registry {
  /**
   * Handles computed command dispatch.
   */
  ['run']() {}
}

describe('CLI knowledge-base command', () => {
  it('should register the command', () => {
    expect(getKnowledgeBaseCommand()).toBeDefined();
  });
});
```

### Incorrect

```typescript
export default function () {
  return { retries: 3 };
}

class Registry {
  ['run']() {}
}

registerCommand(() => {
  return buildCommand();
});
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-jsdoc-anonymous-functions': 'warn'
```

## Autofix Notes

Autofix can insert a missing JSDoc block for standalone anonymous targets such as default export functions.

Autofix intentionally skips unsafe insertion targets such as inline expressions and multi-declarator variable statements.

### Test files and test callbacks are exempt

Functions inside files matching `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js` (and their JSX equivalents) are not checked.

Anonymous callbacks passed to well-known test APIs such as `describe`, `it`, `test`, `beforeAll`, `beforeEach`, `afterAll`, and `afterEach` are also not checked, even when they appear in non-test files.
