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

Nearly all core rules are included in every preset. `require-bdd-spec` is available as an opt-in rule and is disabled by default in the built-in presets. Other preset differences are the severity level and the tighter limits for configurable rules.

| Rule                                     | Recommended    | Strict          |
| ---------------------------------------- | -------------- | --------------- |
| `require-interface-prefix`               | warn           | error           |
| `require-clean-barrel`                   | warn           | error           |
| `require-test-description-style`         | warn           | error           |
| `require-jsdoc-anonymous-functions`      | off            | warn            |
| `require-jsdoc-functions`                | warn           | error           |
| `require-readonly-props`                 | warn           | error           |
| `prefer-readonly-parameters`             | warn           | error           |
| `prefer-result-return`                   | off            | warn            |
| `no-magic-numbers`                       | warn           | error           |
| `no-magic-strings`                       | warn           | error           |
| `no-array-mutation`                      | warn           | error           |
| `no-date-now`                            | warn           | error           |
| `no-object-mutation`                     | warn           | error           |
| `no-banned-types`                        | warn           | error           |
| `no-dynamic-import`                      | warn           | error           |
| `no-literal-unions`                      | warn           | error           |
| `no-export-alias`                        | warn           | error           |
| `no-jest-have-been-called`               | warn           | error           |
| `no-mock-implementation`                 | warn           | error           |
| `no-type-assertion`                      | warn           | error           |
| `no-inline-type-import`                  | warn           | error           |
| `no-destructured-parameter-type-literal` | warn           | error           |
| `no-eslint-disable`                      | warn           | error           |
| `sort-imports`                           | warn           | error           |
| `sort-functions`                         | warn           | error           |
| `max-function-lines`                     | warn (max: 30) | error (max: 25) |
| `max-params`                             | warn (max: 4)  | error (max: 4)  |
| `no-identical-expressions`               | warn           | error           |
| `no-identical-branches`                  | warn           | error           |
| `no-boolean-return-trap`                 | warn           | error           |
| `no-redundant-boolean`                   | warn           | error           |
| `no-empty-catch`                         | warn           | error           |
| `no-non-null-assertion`                  | warn           | error           |
| `no-for-in`                              | warn           | error           |
| `no-labels`                              | warn           | error           |
| `no-parent-imports`                      | warn           | error           |
| `no-with`                                | warn           | error           |
| `no-await-in-loop`                       | warn           | error           |
| `no-floating-promises`                   | warn           | error           |
| `no-throw-literal`                       | warn           | error           |
| `no-parameter-reassign`                  | warn           | error           |
| `no-flag-argument`                       | warn           | error           |
| `prefer-guard-clauses`                   | warn           | error           |
| `prefer-nullish-coalescing`              | warn           | error           |
| `prefer-shortcut-return`                 | warn           | error           |
| `prefer-string-raw`                      | warn           | error           |
| `no-query-side-effects`                  | warn           | error           |
| `no-re-export`                           | warn           | error           |
| `require-optional-chaining`              | warn           | error           |
| `require-bdd-spec`                       | off            | off             |

`require-bdd-spec` is available but intentionally not enabled by default in presets.

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
