<p align="center">
  <img
    src="public/img/zero-tolerance-icon.png"
    alt="ESLint Plugin Zero Tolerance"
    width="200"
  />
</p>

<h1 align="center">@coderrob/eslint-plugin-zero-tolerance</h1>

<p align="center">
  <strong>77 opinionated ESLint rules for TypeScript teams that refuse to compromise on code quality.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance"><img src="https://img.shields.io/npm/v/@coderrob/eslint-plugin-zero-tolerance.svg" alt="npm version" /></a>
  <a href="https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@coderrob/eslint-plugin-zero-tolerance.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/coverage-%E2%89%A595%25-brightgreen" alt="Coverage threshold: at least 95%" />
  <img src="https://img.shields.io/badge/ESLint-8.57%2B%20%7C%209.x%20%7C%2010.x-4B32C3?logo=eslint" alt="ESLint" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

> **Zero tolerance** means every rule earns its place. No warnings you learn to ignore. No exceptions you forget about. Every violation is a conversation about quality — and quality always wins.

## Why Zero Tolerance?

Most linting setups start strict and erode over time. A scattered `eslint-disable` here, an `any` cast there, and before long the rules exist in name only.

This plugin takes the opposite approach:

- **No `eslint-disable` comments** — fix the root cause, don't silence the symptom.
- **No `any` smuggling** — type assertions and non-null assertions are flagged.
- **No magic values** — every number and string earns a name.
- **No leaky tests** — persistent mocks, imprecise matchers, and timer abuse are caught.
- **No complexity hiding** — functions stay short, parameters stay few, imports stay clean.

The result is a codebase where **the rules are the culture** and the culture is visible in every file.

---

## Documentation

|                         |                                                            |
| ----------------------- | ---------------------------------------------------------- |
| **Hosted docs**         | <https://coderrob.github.io/eslint-config-zero-tolerance/> |
| **Rules reference**     | [docs/rules/index.md](docs/rules/index.md)                 |
| **Configuration guide** | [docs/configuration.md](docs/configuration.md)             |

## Packages

This monorepo publishes one package:

| Package                                                                                                          | Description                         |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [`@coderrob/eslint-plugin-zero-tolerance`](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance) | The ESLint plugin — 77 custom rules |

`packages/config` is retained as an internal workspace package for development and compatibility testing; it is not published to npm.

## Requirements

- ESLint 8.57.0+, 9.x, or 10.x
- TypeScript-ESLint 8.x
- TypeScript 5.x

## Installation

```bash
npm install --save-dev @coderrob/eslint-plugin-zero-tolerance @typescript-eslint/parser
```

## Usage

### ESLint 9+ (Flat Config)

**Using the recommended preset:**

```javascript
// eslint.config.js
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.recommended,
  // your other configs...
];
```

**Using the strict preset:**

```javascript
// eslint.config.js
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.strict,
  // your other configs...
];
```

**Custom configuration:**

```javascript
// eslint.config.js
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  {
    plugins: {
      'zero-tolerance': zeroTolerance,
    },
    rules: {
      'zero-tolerance/require-interface-prefix': 'error',
      'zero-tolerance/no-throw-literal': 'error',
      'zero-tolerance/max-function-lines': ['warn', { max: 40 }],
      // ... other rules
    },
  },
];
```

### ESLint 8.x (Legacy Config)

**Using `.eslintrc.js`:**

```javascript
module.exports = {
  plugins: ['@coderrob/zero-tolerance'],
  extends: ['plugin:@coderrob/zero-tolerance/legacy-recommended'],
  // or for strict mode:
  // extends: ['plugin:@coderrob/zero-tolerance/legacy-strict'],
};
```

## Rules

<!-- begin auto-generated rules list -->

The plugin ships **77 rules** across 8 categories. The grouped catalog below is exhaustive and links every rule to its dedicated documentation page.

Preset columns report the configured severity: 💼 for `error`, ⚠️ for `warn`, and 🚫 for `off`. A blank cell means the preset does not configure the rule.

| Category                                  | Rules | Focus                                               |
| ----------------------------------------- | ----: | --------------------------------------------------- |
| [Naming Conventions](#naming-conventions) |     1 | Interface naming standards                          |
| [Documentation](#documentation)           |     5 | JSDoc, BDD specs, optional chaining, readonly props |
| [Testing](#testing)                       |     8 | Test descriptions, mocks, timers, fetch, interfaces |
| [Type Safety](#type-safety)               |    12 | Assertions, unions, imports, exported types         |
| [Code Quality](#code-quality)             |    16 | Function size, magic values, immutability, sorting  |
| [Error Handling](#error-handling)         |     3 | Throw safety, empty catches, Result patterns        |
| [Imports](#imports)                       |    12 | Barrels, re-exports, dynamic imports, node protocol |
| [Bug Prevention](#bug-prevention)         |    20 | Identical code, control flow, async safety          |

🗂️ The type of rule.\
❗ Identifies problems that could cause errors or unexpected behavior.\
📖 Identifies potential improvements.\
💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
🚫 Configurations disabled in.\
R Set in the `recommended` configuration.\
S Set in the `strict` configuration.

### Naming Conventions

Interface naming standards

| Name                                                               | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                 |
| :----------------------------------------------------------------- | :-- | :-- | :-- | :-- | :------------------------------------------ |
| [require-interface-prefix](docs/rules/require-interface-prefix.md) | 📖  | S   | R   |     | Enforce that interface names start with "I" |

### Documentation

JSDoc, BDD specs, optional chaining, readonly props

| Name                                                                                 | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                             |
| :----------------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :---------------------------------------------------------------------------------------------------------------------- |
| [require-bdd-spec](docs/rules/require-bdd-spec.md)                                   | 📖  |     |     | R S | Enforce sibling, source-reference, and export relationships for BDD specs                                               |
| [require-jsdoc-anonymous-functions](docs/rules/require-jsdoc-anonymous-functions.md) | 📖  |     |     | R S | Require JSDoc comments on anonymous function-like constructs except in test files and known test callbacks              |
| [require-jsdoc-functions](docs/rules/require-jsdoc-functions.md)                     | 📖  | S   | R   |     | Require JSDoc comments on all functions and require @param/@returns/@throws tags when applicable (except in test files) |
| [require-optional-chaining](docs/rules/require-optional-chaining.md)                 | 📖  | S   | R   |     | Require optional chaining instead of repeated logical guard access                                                      |
| [require-readonly-props](docs/rules/require-readonly-props.md)                       | 📖  | S   | R   |     | Require readonly typing for JSX component props                                                                         |

### Testing

Test descriptions, mocks, timers, fetch, interfaces

| Name                                                                           | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                                                                                                                                                                          |
| :----------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [no-fetch-in-tests](docs/rules/no-fetch-in-tests.md)                           | 📖  |     |     | R S | Disallow fetch usage in test files                                                                                                                                                                                                                                   |
| [no-jest-have-been-called](docs/rules/no-jest-have-been-called.md)             | 📖  | S   | R   |     | Prohibit toBeCalled, toHaveBeenCalled, toBeCalledWith, toHaveBeenCalledWith, toHaveBeenLastCalledWith, and toLastCalledWith; use toHaveBeenCalledTimes with an explicit call count and toHaveBeenNthCalledWith with an explicit nth-call index and arguments instead |
| [no-mock-implementation](docs/rules/no-mock-implementation.md)                 | 📖  | S   | R   |     | Prohibit persistent mock implementations; use the Once variants to avoid test bleeds                                                                                                                                                                                 |
| [no-restricted-imports-in-tests](docs/rules/no-restricted-imports-in-tests.md) | 📖  |     |     | R S | Disallow restricted dependency imports in test files                                                                                                                                                                                                                 |
| [no-set-interval-in-tests](docs/rules/no-set-interval-in-tests.md)             | 📖  | S   | R   |     | Disallow setInterval usage in test files                                                                                                                                                                                                                             |
| [no-set-timeout-in-tests](docs/rules/no-set-timeout-in-tests.md)               | 📖  | S   | R   |     | Disallow setTimeout usage in test files                                                                                                                                                                                                                              |
| [no-test-interface-declaration](docs/rules/no-test-interface-declaration.md)   | 📖  | S   | R   |     | Disallow interface declarations in test files; import production types instead                                                                                                                                                                                       |
| [require-test-description-style](docs/rules/require-test-description-style.md) | 📖  | S   | R   |     | Enforce that test descriptions start with "should"                                                                                                                                                                                                                   |

### Type Safety

Assertions, unions, imports, exported types

| Name                                                                                           | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                                |
| :--------------------------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :------------------------------------------------------------------------------------------------------------------------- |
| [no-destructured-parameter-type-literal](docs/rules/no-destructured-parameter-type-literal.md) | 📖  | S   | R   |     | Disallow inline object type literals on destructured parameters; require a named type instead                              |
| [no-explicit-any](docs/rules/no-explicit-any.md)                                               | ❗  | S   | R   |     | Disallow explicit any; model unknown values precisely and narrow them explicitly                                           |
| [no-indexed-access-types](docs/rules/no-indexed-access-types.md)                               | ❗  | S   | R   |     | Disallow TypeScript indexed access types                                                                                   |
| [no-inline-type-import](docs/rules/no-inline-type-import.md)                                   | ❗  | S   | R   |     | Disallow TypeScript inline type imports using import("...")                                                                |
| [no-literal-property-unions](docs/rules/no-literal-property-unions.md)                         | 📖  | S   | R   |     | Require property literal unions to use named domain types                                                                  |
| [no-literal-unions](docs/rules/no-literal-unions.md)                                           | 📖  | S   | R   |     | Ban literal unions in favor of enums                                                                                       |
| [no-non-null-assertion](docs/rules/no-non-null-assertion.md)                                   | ❗  | S   | R   |     | Disallow non-null assertions using the "!" postfix operator                                                                |
| [no-return-type](docs/rules/no-return-type.md)                                                 | ❗  | S   | R   |     | Disallow TypeScript ReturnType utility usage                                                                               |
| [no-type-assertion](docs/rules/no-type-assertion.md)                                           | 📖  | S   | R   |     | Prevent use of TypeScript "as" type assertions                                                                             |
| [no-unsafe-json-parse](docs/rules/no-unsafe-json-parse.md)                                     | ❗  | S   | R   |     | Disallow treating JSON.parse results as typed data without validation                                                      |
| [require-exported-object-type](docs/rules/require-exported-object-type.md)                     | 📖  | S   | R   |     | Require exported object constants to declare an explicit type annotation                                                   |
| [require-union-type-alias](docs/rules/require-union-type-alias.md)                             | 📖  | S   | R   |     | Require inline union types with three or more members and multiple type references to be extracted into named type aliases |

### Code Quality

Function size, magic values, immutability, sorting

| Name                                                                         | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                                                           |
| :--------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [max-function-lines](docs/rules/max-function-lines.md)                       | 📖  | S   | R   |     | Enforce a maximum number of lines per function body                                                                                                   |
| [max-params](docs/rules/max-params.md)                                       | 📖  | S   | R   |     | Enforce a maximum number of function parameters                                                                                                       |
| [no-array-mutation](docs/rules/no-array-mutation.md)                         | 📖  | S   | R   |     | Disallow mutating array methods; prefer immutable alternatives such as spread, slice, and toSorted                                                    |
| [no-date-now](docs/rules/no-date-now.md)                                     | 📖  | S   | R   |     | Disallow Date.now() and new Date(); prefer injected clocks for deterministic behavior                                                                 |
| [no-magic-numbers](docs/rules/no-magic-numbers.md)                           | 📖  | S   | R   |     | Disallow magic numbers; use named constants instead of raw numeric literals                                                                           |
| [no-magic-strings](docs/rules/no-magic-strings.md)                           | 📖  | S   | R   |     | Disallow magic strings in comparisons and switch cases; use named constants instead                                                                   |
| [no-map-set-mutation](docs/rules/no-map-set-mutation.md)                     | 📖  | S   | R   |     | Disallow direct Map and Set mutation methods; rebuild collections instead of mutating them in place                                                   |
| [no-object-mutation](docs/rules/no-object-mutation.md)                       | 📖  | S   | R   |     | Disallow direct object-property mutation; prefer creating new objects with immutable update patterns                                                  |
| [no-placeholder-implementation](docs/rules/no-placeholder-implementation.md) | ❗  | S   | R   |     | Disallow placeholder, stub, TODO, and not implemented production code                                                                                 |
| [prefer-nullish-coalescing](docs/rules/prefer-nullish-coalescing.md)         | 📖  | S   | R   |     | Prefer nullish coalescing instead of a nullish guard ternary                                                                                          |
| [prefer-object-spread](docs/rules/prefer-object-spread.md)                   | 📖  | S   | R   |     | Enforce object spread syntax instead of Object.assign with an empty object literal as the first argument                                              |
| [prefer-readonly-parameters](docs/rules/prefer-readonly-parameters.md)       | 📖  | S   | R   |     | Prefer readonly typing for object and array-like parameters to prevent accidental mutation of inputs                                                  |
| [prefer-string-raw](docs/rules/prefer-string-raw.md)                         | 📖  | S   | R   |     | Prefer String.raw for string literals containing escaped backslashes (Sonar S7780)                                                                    |
| [prefer-structured-clone](docs/rules/prefer-structured-clone.md)             | 📖  | S   | R   |     | Prefer structuredClone(...) over JSON.parse(JSON.stringify(...)) when creating a deep clone                                                           |
| [sort-functions](docs/rules/sort-functions.md)                               | 📖  | S   | R   |     | Require top-level functions to be sorted alphabetically                                                                                               |
| [sort-imports](docs/rules/sort-imports.md)                                   | 📖  | S   | R   |     | Require import declarations to be grouped (side-effect -> builtin -> external -> parent -> peer -> index) and sorted alphabetically within each group |

### Error Handling

Throw safety, empty catches, Result patterns

| Name                                                       | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                               |
| :--------------------------------------------------------- | :-- | :-- | :-- | :-- | :-------------------------------------------------------------------------------------------------------- |
| [no-empty-catch](docs/rules/no-empty-catch.md)             | ❗  | S   | R   |     | Disallow empty catch blocks that silently swallow errors                                                  |
| [no-throw-literal](docs/rules/no-throw-literal.md)         | ❗  | S   | R   |     | Disallow throwing literals, objects, or templates; always throw a new Error instance                      |
| [prefer-result-return](docs/rules/prefer-result-return.md) | 📖  |     | S   | R   | Prefer Result-style return values instead of throw statements to make error flows explicit and composable |

### Imports

Barrels, re-exports, dynamic imports, node protocol

| Name                                                                             | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                                                                                       |
| :------------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [no-barrel-parent-imports](docs/rules/no-barrel-parent-imports.md)               | 📖  | S   | R   |     | Disallow parent-directory imports (`..` and `../*`) inside barrel files (`index.*`) across import declarations, import expressions, require calls, and import-equals declarations |
| [no-dynamic-import](docs/rules/no-dynamic-import.md)                             | ❗  | S   | R   |     | Ban await import() and require() except in test files                                                                                                                             |
| [no-export-alias](docs/rules/no-export-alias.md)                                 | 📖  | S   | R   |     | Prevent use of alias in export statements                                                                                                                                         |
| [no-hardcoded-secrets](docs/rules/no-hardcoded-secrets.md)                       | ❗  | S   | R   |     | Disallow hardcoded secrets, credentials, tokens, and secret env defaults                                                                                                          |
| [no-parent-internal-access](docs/rules/no-parent-internal-access.md)             | 📖  |     |     | R S | Disallow parent-relative access into protected internal directories such as src                                                                                                   |
| [no-raw-sql-interpolation](docs/rules/no-raw-sql-interpolation.md)               | ❗  | S   | R   |     | Disallow interpolated raw SQL and unsafe raw query helpers                                                                                                                        |
| [no-re-export](docs/rules/no-re-export.md)                                       | 📖  | S   | R   |     | Disallow direct or indirect re-export statements from parent or ancestor modules; barrel files (index.*) are exempt from this restriction                                         |
| [no-shell-command-construction](docs/rules/no-shell-command-construction.md)     | ❗  | S   | R   |     | Disallow shell command construction through subprocess APIs                                                                                                                       |
| [no-unsafe-code-generation](docs/rules/no-unsafe-code-generation.md)             | ❗  | S   | R   |     | Disallow eval, Function constructors, string timers, and vm code execution APIs                                                                                                   |
| [require-barrel-relative-exports](docs/rules/require-barrel-relative-exports.md) | 📖  | S   | R   |     | Require barrel re-export declarations to use current-directory descendant paths that start with './'                                                                              |
| [require-clean-barrel](docs/rules/require-clean-barrel.md)                       | 📖  | S   | R   |     | Require barrel files (index.*) to contain only module re-export declarations                                                                                                      |
| [require-node-protocol](docs/rules/require-node-protocol.md)                     | 📖  | S   | R   |     | Require Node.js built-in module imports to use the `node:` protocol prefix                                                                                                        |

### Bug Prevention

Identical code, control flow, async safety

| Name                                                                         | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                   |
| :--------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :------------------------------------------------------------------------------------------------------------ |
| [no-await-in-loop](docs/rules/no-await-in-loop.md)                           | ❗  | S   | R   |     | Disallow await expressions inside loops; use Promise.all() for parallel execution                             |
| [no-boolean-return-trap](docs/rules/no-boolean-return-trap.md)               | 📖  | S   | R   |     | Disallow ambiguous boolean-return APIs; prefer predicate naming or richer result types for clearer call sites |
| [no-eslint-disable](docs/rules/no-eslint-disable.md)                         | 📖  | S   | R   |     | Prevent use of eslint-disable comments                                                                        |
| [no-flag-argument](docs/rules/no-flag-argument.md)                           | 📖  | S   | R   |     | Disallow boolean flag arguments in function declarations; prefer explicit methods or command objects          |
| [no-floating-promises](docs/rules/no-floating-promises.md)                   | ❗  | S   | R   |     | Disallow floating promises; explicitly handle with await, void, or rejection handlers                         |
| [no-for-in](docs/rules/no-for-in.md)                                         | ❗  | S   | R   |     | Disallow for..in loops; use Object.keys/values/entries to avoid prototype-chain iteration                     |
| [no-identical-branches](docs/rules/no-identical-branches.md)                 | 📖  | S   | R   |     | Disallow identical if/else and conditional-expression branches; consolidate duplicate conditional fragments   |
| [no-identical-expressions](docs/rules/no-identical-expressions.md)           | ❗  | S   | R   |     | Disallow identical expressions on both sides of a binary or logical operator (Sonar S1764)                    |
| [no-labels](docs/rules/no-labels.md)                                         | ❗  | S   | R   |     | Disallow labels because they make control flow harder to reason about                                         |
| [no-math-random](docs/rules/no-math-random.md)                               | ❗  | S   | R   |     | Disallow Math.random(); inject randomness explicitly or use a dedicated random source                         |
| [no-parameter-reassign](docs/rules/no-parameter-reassign.md)                 | 📖  | S   | R   |     | Disallow assignments and updates to function parameters; use a new local variable instead                     |
| [no-process-env-outside-config](docs/rules/no-process-env-outside-config.md) | ❗  | S   | R   |     | Disallow process.env reads outside configuration modules; import typed config instead                         |
| [no-query-side-effects](docs/rules/no-query-side-effects.md)                 | 📖  | S   | R   |     | Disallow side effects in query-style functions (get*/is*/has*/can*/should*); separate query from modifier     |
| [no-redundant-boolean](docs/rules/no-redundant-boolean.md)                   | 📖  | S   | R   |     | Disallow redundant comparisons to boolean literals (Sonar S1125)                                              |
| [no-ts-nocheck](docs/rules/no-ts-nocheck.md)                                 | ❗  | S   | R   |     | Prevent use of @ts-nocheck comments                                                                           |
| [no-with](docs/rules/no-with.md)                                             | ❗  | S   | R   |     | Disallow with statements because they make scope resolution unpredictable                                     |
| [prefer-guard-clauses](docs/rules/prefer-guard-clauses.md)                   | 📖  | S   | R   |     | Prefer guard clauses by disallowing else blocks when the if branch already terminates control flow            |
| [prefer-shortcut-return](docs/rules/prefer-shortcut-return.md)               | 📖  | S   | R   |     | Prefer shortcut boolean returns by replacing if/return true-false patterns with direct return expressions     |
| [require-exhaustive-switch](docs/rules/require-exhaustive-switch.md)         | 📖  | S   | R   |     | Require exhaustive switch statements over finite union, enum, and boolean discriminants                       |
| [require-timeout-for-io](docs/rules/require-timeout-for-io.md)               | ❗  | S   | R   |     | Require timeout or cancellation options for external IO calls                                                 |

<!-- end auto-generated rules list -->

## Development

> This repository itself is a `pnpm` workspace and **dogfoods its own rules** through [`eslint.config.mjs`](eslint.config.mjs). Every source file in the plugin must pass the same rules it enforces on consumers.

### Setup

```bash
pnpm install
```

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

Coverage gates are enforced per-file at **95%** minimum across statements, branches, functions, and lines. The static badge reports this enforced contract rather than a generated point-in-time percentage.

### README Sync

```bash
pnpm readme:sync
pnpm validate:readme
```

`eslint-doc-generator` builds the root rule catalog from the published plugin shape and deterministic category metadata in `scripts/metadata/readme-rule-catalog.json`. It verifies rule documentation links and derives error, warning, and off states from the exported presets.

### Type Checking

```bash
pnpm --filter @coderrob/eslint-plugin-zero-tolerance exec tsc -p tsconfig.json --noEmit
pnpm --filter @coderrob/eslint-config-zero-tolerance exec tsc -p tsconfig.json --noEmit
```

### Dependency Graph

```bash
pnpm deps:graph
pnpm deps:circular
```

## Publishing

Only `@coderrob/eslint-plugin-zero-tolerance` is published. Update its version and the dated changelog entry in the release PR, then run the full validation suite. After that commit has passed CI, publish from a clean, authenticated checkout:

```bash
pnpm lint
pnpm test
pnpm release:publish:plugin
```

The publish command targets only `packages/plugin`; its `prepack` lifecycle rebuilds the package before `npm publish --access public`. The internal config workspace package is not published.

## License

Apache 2.0 Copyright Robert Lindley
