# @coderrob/eslint-plugin-zero-tolerance

Zero-tolerance ESLint plugin and config for enforcing strict code quality standards in TypeScript projects.

[![npm version](https://img.shields.io/npm/v/@coderrob/eslint-plugin-zero-tolerance.svg)](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance)
[![License](https://img.shields.io/npm/l/@coderrob/eslint-plugin-zero-tolerance.svg)](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE)

## What is this?

`@coderrob/eslint-plugin-zero-tolerance` is a collection of custom ESLint rules designed to enforce a zero-tolerance policy on common TypeScript code quality issues. The rules cover:

- **Naming conventions** - prefix interfaces with `I`, sort imports and functions alphabetically
- **Documentation** - require JSDoc on all functions and enforce sibling BDD spec files
- **Testing standards** - enforce `should`-prefixed descriptions, ban imprecise Jest matchers and leaky mocks
- **Type safety** - ban `as` assertions, non-null `!` operators, literal union types, and banned utility types
- **Code quality** - limit function length and parameter count, eliminate magic numbers and strings
- **Error handling** - require `new Error()` in throw statements, disallow empty catch blocks
- **Import hygiene** - ban parent-relative imports, dynamic imports, and export aliases
- **Bug prevention** - flag identical expressions, redundant boolean comparisons, shortcut-return opportunities, and `await` inside loops

## Packages

This monorepo publishes two packages:

| Package                                                                                                          | Description                                     |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`@coderrob/eslint-plugin-zero-tolerance`](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance) | The ESLint plugin with all custom rules         |
| [`@coderrob/eslint-config-zero-tolerance`](https://www.npmjs.com/package/@coderrob/eslint-config-zero-tolerance) | Pre-built recommended and strict config presets |

## Quick Start

```bash
npm install --save-dev @coderrob/eslint-plugin-zero-tolerance
```

```js
// eslint.config.js (ESLint 9+ Flat Config)
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [zeroTolerance.configs.recommended];
```

See the [Getting Started](getting-started.md) guide for full setup instructions and the [Rules](rules/index.md) reference for descriptions of every rule.
