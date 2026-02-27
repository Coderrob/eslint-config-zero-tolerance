# Configuration

`eslint-plugin-zero-tolerance` ships with four built-in config presets so you can go from zero to linting in one line.

## Preset Overview

| Preset               | Severity | Use case                                                                |
| -------------------- | -------- | ----------------------------------------------------------------------- |
| `recommended`        | `warn`   | Gradual adoption; shows violations without breaking the build           |
| `strict`             | `error`  | New projects or full zero-tolerance enforcement; fails on any violation |
| `legacy-recommended` | `warn`   | ESLint 8 `.eslintrc` format                                             |
| `legacy-strict`      | `error`  | ESLint 8 `.eslintrc` format                                             |

## Flat Config Presets (ESLint 9+)

### `recommended`

All rules enabled at `warn`. Function body limit: **20 lines**. Parameter limit: **4**.

```js title="eslint.config.js"
import zeroTolerance from 'eslint-plugin-zero-tolerance';

export default [zeroTolerance.configs.recommended];
```

### `strict`

All rules enabled at `error`. Function body limit: **10 lines**. Parameter limit: **4**.

```js title="eslint.config.js"
import zeroTolerance from 'eslint-plugin-zero-tolerance';

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

All rules are included in every preset. The only difference between `recommended` and `strict` is the severity level and the tighter limits for configurable rules.

| Rule                             | Recommended    | Strict          |
| -------------------------------- | -------------- | --------------- |
| `require-interface-prefix`       | warn           | error           |
| `require-test-description-style` | warn           | error           |
| `require-zod-schema-description` | warn           | error           |
| `require-jsdoc-functions`        | warn           | error           |
| `no-magic-numbers`               | warn           | error           |
| `no-magic-strings`               | warn           | error           |
| `no-banned-types`                | warn           | error           |
| `no-relative-parent-imports`     | warn           | error           |
| `no-dynamic-import`              | warn           | error           |
| `no-literal-unions`              | warn           | error           |
| `no-export-alias`                | warn           | error           |
| `no-jest-have-been-called`       | warn           | error           |
| `no-mock-implementation`         | warn           | error           |
| `no-type-assertion`              | warn           | error           |
| `no-eslint-disable`              | warn           | error           |
| `sort-imports`                   | warn           | error           |
| `sort-functions`                 | warn           | error           |
| `max-function-lines`             | warn (max: 20) | error (max: 10) |
| `max-params`                     | warn (max: 4)  | error (max: 4)  |
| `no-identical-expressions`       | warn           | error           |
| `no-redundant-boolean`           | warn           | error           |
| `no-empty-catch`                 | warn           | error           |
| `no-non-null-assertion`          | warn           | error           |
| `no-await-in-loop`               | warn           | error           |
| `no-throw-literal`               | warn           | error           |
| `no-re-export`                   | warn           | error           |
| `require-optional-chaining`      | warn           | error           |

## Disabling Individual Rules

Override any rule to `off` inside your config:

```js title="eslint.config.js"
import zeroTolerance from 'eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.recommended,
  {
    rules: {
      // Disable rules that don't suit your project
      'zero-tolerance/require-zod-schema-description': 'off',
      'zero-tolerance/sort-functions': 'off',
    },
  },
];
```

## Configuring Rule Options

Two rules accept an options object:

### `max-function-lines`

```js
'zero-tolerance/max-function-lines': ['warn', { max: 50 }]
```

### `max-params`

```js
'zero-tolerance/max-params': ['error', { max: 3 }]
```
