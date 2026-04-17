# @coderrob/eslint-plugin-zero-tolerance

**67 opinionated ESLint rules for TypeScript teams that refuse to compromise on code quality.**

[![npm version](https://img.shields.io/npm/v/@coderrob/eslint-plugin-zero-tolerance.svg)](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance)
[![License](https://img.shields.io/npm/l/@coderrob/eslint-plugin-zero-tolerance.svg)](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE)

**Supports ESLint 8.57+, 9.x, and 10.x**

---

## Why Zero Tolerance?

Most linting setups start strict and erode over time. A scattered `eslint-disable` here, an `any` cast there, and before long the rules exist in name only.

This plugin takes the opposite approach. Every rule earns its place, every violation is actionable, and the codebase stays honest.

## What It Covers

`@coderrob/eslint-plugin-zero-tolerance` provides rules across **eight categories**:

| Category           | What it enforces                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Type Safety**    | Ban unsafe assertions (`as`, `!`), literal unions, inline imports, and untyped exports                |
| **Code Quality**   | Limit function size and parameters, eliminate magic values, enforce immutability and sort order       |
| **Testing**        | Require `should`-prefixed descriptions, ban leaky mocks, imprecise matchers, and timer/fetch abuse    |
| **Bug Prevention** | Flag identical expressions, redundant booleans, missing awaits, floating promises, and flag arguments |
| **Error Handling** | Require `new Error()` throws, ban empty catches, encourage Result-style returns                       |
| **Imports**        | Keep barrels clean, ban dynamic imports, prevent re-exports and parent-directory traversal            |
| **Documentation**  | Require JSDoc on functions, enforce BDD specs, mandate optional chaining and readonly props           |
| **Naming**         | Enforce `I`-prefixed interfaces                                                                       |

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
