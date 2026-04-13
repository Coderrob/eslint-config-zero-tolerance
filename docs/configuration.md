# Configuration

`@coderrob/eslint-plugin-zero-tolerance` ships with four built-in config presets so you can go from zero to linting in one line.

## Preset Overview

| Preset               | Severity | Use case                                                                |
| -------------------- | -------- | ----------------------------------------------------------------------- |
| `recommended`        | `warn`   | Gradual adoption; shows violations without breaking the build           |
| `strict`             | `error`  | New projects or full zero-tolerance enforcement; fails on any violation |
| `legacy-recommended` | `warn`   | ESLint 8 `.eslintrc` format                                             |
| `legacy-strict`      | `error`  | ESLint 8 `.eslintrc` format                                             |

## Preset Enum

Internally, flat-config preset selection is typed with a `Preset` enum:

- `Preset.Recommended` = `'recommended'`
- `Preset.Strict` = `'strict'`

This enum is used by the shared config/rule builders to avoid stringly-typed preset branching.

## Flat Config Presets (ESLint 9+/10+)

### `recommended`

Most rules enabled at `warn` (with a few documented exceptions disabled). Function body limit: **30 lines**. Parameter limit: **4**.

```js title="eslint.config.js"
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [zeroTolerance.configs.recommended];
```

### `strict`

All rules enabled at `error`. Function body limit: **25 lines**. Parameter limit: **4**.

```js title="eslint.config.js"
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [zeroTolerance.configs.strict];
```

## Legacy Config Presets (ESLint 8)

### `legacy-recommended`

```js title=".eslintrc.js"
module.exports = {
  extends: ['plugin:zero-tolerance/legacy-recommended'],
};
```

### `legacy-strict`

```js title=".eslintrc.js"
module.exports = {
  extends: ['plugin:zero-tolerance/legacy-strict'],
};
```

## Rules Included in Each Preset

Nearly all core rules are included in every preset. `require-bdd-spec`, `no-parent-internal-access`, `no-fetch-in-tests`, and `no-restricted-imports-in-tests` are available as opt-in rules and are disabled by default in the built-in presets. Other preset differences are the severity level and the tighter limits for configurable rules.

| Rule                                     | Recommended    | Strict          |
| ---------------------------------------- | -------------- | --------------- |
| `max-function-lines`                     | warn (max: 30) | error (max: 25) |
| `max-params`                             | warn (max: 4)  | error (max: 4)  |
| `no-array-mutation`                      | warn           | error           |
| `no-await-in-loop`                       | warn           | error           |
| `no-banned-types`                        | warn           | error           |
| `no-barrel-parent-imports`               | warn           | error           |
| `no-boolean-return-trap`                 | warn           | error           |
| `no-date-now`                            | warn           | error           |
| `no-destructured-parameter-type-literal` | warn           | error           |
| `no-dynamic-import`                      | warn           | error           |
| `no-empty-catch`                         | warn           | error           |
| `no-eslint-disable`                      | warn           | error           |
| `no-export-alias`                        | warn           | error           |
| `no-fetch-in-tests`                      | off            | off             |
| `no-flag-argument`                       | warn           | error           |
| `no-floating-promises`                   | warn           | error           |
| `no-for-in`                              | warn           | error           |
| `no-identical-branches`                  | warn           | error           |
| `no-identical-expressions`               | warn           | error           |
| `no-inline-type-import`                  | warn           | error           |
| `no-jest-have-been-called`               | warn           | error           |
| `no-labels`                              | warn           | error           |
| `no-literal-property-unions`             | warn           | error           |
| `no-literal-unions`                      | warn           | error           |
| `no-magic-numbers`                       | warn           | error           |
| `no-magic-strings`                       | warn           | error           |
| `no-mock-implementation`                 | warn           | error           |
| `no-non-null-assertion`                  | warn           | error           |
| `no-object-mutation`                     | warn           | error           |
| `no-parameter-reassign`                  | warn           | error           |
| `no-parent-internal-access`              | off            | off             |
| `no-query-side-effects`                  | warn           | error           |
| `no-re-export`                           | warn           | error           |
| `no-redundant-boolean`                   | warn           | error           |
| `no-restricted-imports-in-tests`         | off            | off             |
| `no-set-interval-in-tests`               | warn           | error           |
| `no-set-timeout-in-tests`                | warn           | error           |
| `no-test-interface-declaration`          | warn           | error           |
| `no-throw-literal`                       | warn           | error           |
| `no-type-assertion`                      | warn           | error           |
| `no-with`                                | warn           | error           |
| `prefer-guard-clauses`                   | warn           | error           |
| `prefer-nullish-coalescing`              | warn           | error           |
| `prefer-readonly-parameters`             | warn           | error           |
| `prefer-result-return`                   | off            | warn            |
| `prefer-shortcut-return`                 | warn           | error           |
| `prefer-string-raw`                      | warn           | error           |
| `prefer-object-spread`                   | warn           | error           |
| `require-bdd-spec`                       | off            | off             |
| `require-clean-barrel`                   | warn           | error           |
| `require-exported-object-type`           | warn           | error           |
| `require-interface-prefix`               | warn           | error           |
| `require-jsdoc-anonymous-functions`      | off            | warn            |
| `require-jsdoc-functions`                | warn           | error           |
| `require-node-protocol`                  | warn           | error           |
| `require-optional-chaining`              | warn           | error           |
| `require-readonly-props`                 | warn           | error           |
| `require-test-description-style`         | warn           | error           |
| `require-union-type-alias`               | warn           | error           |
| `sort-functions`                         | warn           | error           |
| `sort-imports`                           | warn           | error           |

`require-bdd-spec`, `no-parent-internal-access`, `no-fetch-in-tests`, and `no-restricted-imports-in-tests` are available but intentionally not enabled by default in presets.

## Disabling Individual Rules

Override any rule to `off` inside your config:

```js title="eslint.config.js"
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.recommended,
  {
    rules: {
      // Disable rules that don't suit your project
      'zero-tolerance/sort-functions': 'off',
    },
  },
];
```

## Configuring Rule Options

Multiple rules accept an options object:

### `max-function-lines`

```js
'zero-tolerance/max-function-lines': ['warn', { max: 50 }]
```

### `max-params`

```js
'zero-tolerance/max-params': ['error', { max: 3 }]
```

### `no-magic-strings`

```js
'zero-tolerance/no-magic-strings': [
  'error',
  { checkComparisons: true, checkSwitchCases: true, ignoreValues: ['production'] },
]
```

### `require-test-description-style`

```js
'zero-tolerance/require-test-description-style': ['error', { prefix: 'should', ignoreSkip: true }]
```

### `no-restricted-imports-in-tests`

```js
'zero-tolerance/no-restricted-imports-in-tests': [
  'error',
  { modules: ['fs', 'node:fs/*', 'child_process', 'axios', '@company/database'] },
]
```

Configured module names are trimmed, lowercased, normalized by removing `node:`, and matched by module root. For example, `fs` matches `fs`, `fs/promises`, `node:fs`, and `node:fs/promises`.

### `no-throw-literal`

```js
'zero-tolerance/no-throw-literal': [
  'error',
  {
    allowThrowingCallExpressions: false,
    allowThrowingMemberExpressions: false,
    allowThrowingAwaitExpressions: false,
  },
]
```

### `no-parent-internal-access`

```js
'zero-tolerance/no-parent-internal-access': [
  'error',
  { protectedDirectories: ['src', 'app', 'internal'] },
]
```

The rule matches only the first concrete directory reached after `..` traversal, so `../src/foo` is reported but `../shared/src/foo` is not unless `shared` is also protected. Configured directory names are trimmed and deduplicated, and empty entries are ignored.
