<p align="center">
  <img
    src="public/img/zero-tolerance-icon.png"
    alt="ESLint Plugin Zero Tolerance"
    width="200"
  />
</p>

<h1 align="center">@coderrob/eslint-plugin-zero-tolerance</h1>

<p align="center">
  <strong>69 opinionated ESLint rules for TypeScript teams that refuse to compromise on code quality.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance"><img src="https://img.shields.io/npm/v/@coderrob/eslint-plugin-zero-tolerance.svg" alt="npm version" /></a>
  <a href="https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@coderrob/eslint-plugin-zero-tolerance.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/coverage-99.97%25-brightgreen" alt="Coverage" />
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

This monorepo publishes two packages:

| Package                                                                                                          | Description                                         |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`@coderrob/eslint-plugin-zero-tolerance`](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance) | The ESLint plugin — 69 custom rules                 |
| [`@coderrob/eslint-config-zero-tolerance`](https://www.npmjs.com/package/@coderrob/eslint-config-zero-tolerance) | Pre-built `recommended` and `strict` config presets |

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

**Alternative: Import presets directly from the config package:**

```javascript
// eslint.config.js
import recommended from '@coderrob/eslint-config-zero-tolerance/recommended';
// or
import strict from '@coderrob/eslint-config-zero-tolerance/strict';

export default [
  recommended, // or strict
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
  plugins: ['zero-tolerance'],
  extends: ['plugin:zero-tolerance/legacy-recommended'],
  // or for strict mode:
  // extends: ['plugin:zero-tolerance/legacy-strict'],
};
```

<!-- GENERATED:README_RULES_START -->
## Rules

The plugin ships **69 rules** across 8 categories. The grouped catalog below is exhaustive and links every rule to its dedicated documentation page.

Preset legend:

- `Both` = enabled by both `recommended` and `strict`
- `Strict only` = enabled only by `strict`
- `Opt-in` = not enabled by either preset

| Category | Rules | Focus |
| -------- | ----: | ----- |
| [Naming Conventions](#naming-conventions) |     1 | Interface naming standards |
| [Documentation](#documentation) |     5 | JSDoc, BDD specs, optional chaining, readonly props |
| [Testing](#testing) |     8 | Test descriptions, mocks, timers, fetch, interfaces |
| [Type Safety](#type-safety) |    11 | Assertions, unions, imports, exported types |
| [Code Quality](#code-quality) |    15 | Function size, magic values, immutability, sorting |
| [Error Handling](#error-handling) |     3 | Throw safety, empty catches, Result patterns |
| [Imports](#imports) |     8 | Barrels, re-exports, dynamic imports, node protocol |
| [Bug Prevention](#bug-prevention) |    18 | Identical code, control flow, async safety |

### Naming Conventions

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`require-interface-prefix`](docs/rules/require-interface-prefix.md) | `suggestion` | Both | Enforce that interface names start with "I" |

### Documentation

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`require-bdd-spec`](docs/rules/require-bdd-spec.md) | `suggestion` | Opt-in | Enforce that every TypeScript source file has a valid sibling .ts.bdd.json BDD spec file |
| [`require-jsdoc-anonymous-functions`](docs/rules/require-jsdoc-anonymous-functions.md) | `suggestion` | Strict only | Require JSDoc comments on anonymous function-like constructs except in test files and known test callbacks |
| [`require-jsdoc-functions`](docs/rules/require-jsdoc-functions.md) | `suggestion` | Both | Require JSDoc comments on all functions and require @param/@returns/@throws tags when applicable (except in test files) |
| [`require-optional-chaining`](docs/rules/require-optional-chaining.md) | `suggestion` | Both | Require optional chaining instead of repeated logical guard access |
| [`require-readonly-props`](docs/rules/require-readonly-props.md) | `suggestion` | Both | Require readonly typing for JSX component props |

### Testing

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`require-test-description-style`](docs/rules/require-test-description-style.md) | `suggestion` | Both | Enforce that test descriptions start with "should" |
| [`no-jest-have-been-called`](docs/rules/no-jest-have-been-called.md) | `suggestion` | Both | Prohibit toBeCalled, toHaveBeenCalled, toBeCalledWith, toHaveBeenCalledWith, toHaveBeenLastCalledWith, and toLastCalledWith; use toHaveBeenCalledTimes with an explicit call count and toHaveBeenNthCalledWith with an explicit nth-call index and arguments instead |
| [`no-mock-implementation`](docs/rules/no-mock-implementation.md) | `suggestion` | Both | Prohibit persistent mock implementations; use the Once variants to avoid test bleeds |
| [`no-set-timeout-in-tests`](docs/rules/no-set-timeout-in-tests.md) | `suggestion` | Both | Disallow setTimeout usage in test files |
| [`no-set-interval-in-tests`](docs/rules/no-set-interval-in-tests.md) | `suggestion` | Both | Disallow setInterval usage in test files |
| [`no-fetch-in-tests`](docs/rules/no-fetch-in-tests.md) | `suggestion` | Opt-in | Disallow fetch usage in test files |
| [`no-restricted-imports-in-tests`](docs/rules/no-restricted-imports-in-tests.md) | `suggestion` | Opt-in | Disallow restricted dependency imports in test files |
| [`no-test-interface-declaration`](docs/rules/no-test-interface-declaration.md) | `suggestion` | Both | Disallow interface declarations in test files; import production types instead |

### Type Safety

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`no-type-assertion`](docs/rules/no-type-assertion.md) | `suggestion` | Both | Prevent use of TypeScript "as" type assertions |
| [`no-non-null-assertion`](docs/rules/no-non-null-assertion.md) | `problem` | Both | Disallow non-null assertions using the "!" postfix operator |
| [`no-explicit-any`](docs/rules/no-explicit-any.md) | `problem` | Both | Disallow explicit any; model unknown values precisely and narrow them explicitly |
| [`no-indexed-access-types`](docs/rules/no-indexed-access-types.md) | `problem` | Both | Disallow TypeScript indexed access types |
| [`no-literal-unions`](docs/rules/no-literal-unions.md) | `suggestion` | Both | Ban literal unions in favor of enums |
| [`no-literal-property-unions`](docs/rules/no-literal-property-unions.md) | `suggestion` | Both | Require property literal unions to use named domain types |
| [`no-inline-type-import`](docs/rules/no-inline-type-import.md) | `problem` | Both | Disallow TypeScript inline type imports using import("...") |
| [`no-return-type`](docs/rules/no-return-type.md) | `problem` | Both | Disallow TypeScript ReturnType utility usage |
| [`require-union-type-alias`](docs/rules/require-union-type-alias.md) | `suggestion` | Both | Require inline union types with multiple type references to be extracted into named type aliases |
| [`no-destructured-parameter-type-literal`](docs/rules/no-destructured-parameter-type-literal.md) | `suggestion` | Both | Disallow inline object type literals on destructured parameters; require a named type instead |
| [`require-exported-object-type`](docs/rules/require-exported-object-type.md) | `suggestion` | Both | Require exported object constants to declare an explicit type annotation |

### Code Quality

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`max-function-lines`](docs/rules/max-function-lines.md) | `suggestion` | Both | Enforce a maximum number of lines per function body |
| [`max-params`](docs/rules/max-params.md) | `suggestion` | Both | Enforce a maximum number of function parameters |
| [`no-array-mutation`](docs/rules/no-array-mutation.md) | `suggestion` | Both | Disallow mutating array methods; prefer immutable alternatives such as spread, slice, and toSorted |
| [`no-date-now`](docs/rules/no-date-now.md) | `suggestion` | Both | Disallow Date.now() and new Date(); prefer injected clocks for deterministic behavior |
| [`no-magic-numbers`](docs/rules/no-magic-numbers.md) | `suggestion` | Both | Disallow magic numbers; use named constants instead of raw numeric literals |
| [`no-magic-strings`](docs/rules/no-magic-strings.md) | `suggestion` | Both | Disallow magic strings in comparisons and switch cases; use named constants instead |
| [`no-map-set-mutation`](docs/rules/no-map-set-mutation.md) | `suggestion` | Both | Disallow direct Map and Set mutation methods; rebuild collections instead of mutating them in place |
| [`no-object-mutation`](docs/rules/no-object-mutation.md) | `suggestion` | Both | Disallow direct object-property mutation; prefer creating new objects with immutable update patterns |
| [`sort-imports`](docs/rules/sort-imports.md) | `suggestion` | Both | Require import declarations to be grouped (side-effect -> builtin -> external -> parent -> peer -> index) and sorted alphabetically within each group |
| [`sort-functions`](docs/rules/sort-functions.md) | `suggestion` | Both | Require top-level functions to be sorted alphabetically |
| [`prefer-nullish-coalescing`](docs/rules/prefer-nullish-coalescing.md) | `suggestion` | Both | Prefer nullish coalescing instead of a nullish guard ternary |
| [`prefer-object-spread`](docs/rules/prefer-object-spread.md) | `suggestion` | Both | Enforce object spread syntax instead of Object.assign with an empty object literal as the first argument |
| [`prefer-readonly-parameters`](docs/rules/prefer-readonly-parameters.md) | `suggestion` | Both | Prefer readonly typing for object and array-like parameters to prevent accidental mutation of inputs |
| [`prefer-string-raw`](docs/rules/prefer-string-raw.md) | `suggestion` | Both | Prefer String.raw for string literals containing escaped backslashes (Sonar S7780) |
| [`prefer-structured-clone`](docs/rules/prefer-structured-clone.md) | `suggestion` | Both | Prefer structuredClone(...) over JSON.parse(JSON.stringify(...)) when creating a deep clone |

### Error Handling

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`no-empty-catch`](docs/rules/no-empty-catch.md) | `problem` | Both | Disallow empty catch blocks that silently swallow errors |
| [`no-throw-literal`](docs/rules/no-throw-literal.md) | `problem` | Both | Disallow throwing literals, objects, or templates; always throw a new Error instance |
| [`prefer-result-return`](docs/rules/prefer-result-return.md) | `suggestion` | Strict only | Prefer Result-style return values instead of throw statements to make error flows explicit and composable |

### Imports

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`require-clean-barrel`](docs/rules/require-clean-barrel.md) | `suggestion` | Both | Require barrel files (index.*) to contain only module re-export declarations |
| [`require-barrel-relative-exports`](docs/rules/require-barrel-relative-exports.md) | `suggestion` | Both | Require barrel re-export declarations to use current-directory descendant paths that start with './' |
| [`no-dynamic-import`](docs/rules/no-dynamic-import.md) | `problem` | Both | Ban await import() and require() except in test files |
| [`no-export-alias`](docs/rules/no-export-alias.md) | `suggestion` | Both | Prevent use of alias in export statements |
| [`no-barrel-parent-imports`](docs/rules/no-barrel-parent-imports.md) | `suggestion` | Both | Disallow parent-directory imports (`..` and `../*`) inside barrel files (`index.*`) across import declarations, import expressions, require calls, and import-equals declarations |
| [`no-parent-internal-access`](docs/rules/no-parent-internal-access.md) | `suggestion` | Opt-in | Disallow parent-relative access into protected internal directories such as src |
| [`no-re-export`](docs/rules/no-re-export.md) | `suggestion` | Both | Disallow direct or indirect re-export statements from parent or ancestor modules; barrel files (index.*) are exempt from this restriction |
| [`require-node-protocol`](docs/rules/require-node-protocol.md) | `suggestion` | Both | Require Node.js built-in module imports to use the `node:` protocol prefix |

### Bug Prevention

| Rule | Type | Preset | Description |
| ---- | ---- | ------ | ----------- |
| [`no-identical-expressions`](docs/rules/no-identical-expressions.md) | `problem` | Both | Disallow identical expressions on both sides of a binary or logical operator (Sonar S1764) |
| [`no-identical-branches`](docs/rules/no-identical-branches.md) | `suggestion` | Both | Disallow identical if/else and conditional-expression branches; consolidate duplicate conditional fragments |
| [`no-boolean-return-trap`](docs/rules/no-boolean-return-trap.md) | `suggestion` | Both | Disallow ambiguous boolean-return APIs; prefer predicate naming or richer result types for clearer call sites |
| [`no-redundant-boolean`](docs/rules/no-redundant-boolean.md) | `suggestion` | Both | Disallow redundant comparisons to boolean literals (Sonar S1125) |
| [`no-for-in`](docs/rules/no-for-in.md) | `problem` | Both | Disallow for..in loops; use Object.keys/values/entries to avoid prototype-chain iteration |
| [`no-labels`](docs/rules/no-labels.md) | `problem` | Both | Disallow labels because they make control flow harder to reason about |
| [`no-with`](docs/rules/no-with.md) | `problem` | Both | Disallow with statements because they make scope resolution unpredictable |
| [`no-await-in-loop`](docs/rules/no-await-in-loop.md) | `problem` | Both | Disallow await expressions inside loops; use Promise.all() for parallel execution |
| [`no-floating-promises`](docs/rules/no-floating-promises.md) | `problem` | Both | Disallow floating promises; explicitly handle with await, void, or rejection handlers |
| [`no-math-random`](docs/rules/no-math-random.md) | `problem` | Both | Disallow Math.random(); inject randomness explicitly or use a dedicated random source |
| [`no-eslint-disable`](docs/rules/no-eslint-disable.md) | `suggestion` | Both | Prevent use of eslint-disable comments |
| [`no-parameter-reassign`](docs/rules/no-parameter-reassign.md) | `suggestion` | Both | Disallow assignments and updates to function parameters; use a new local variable instead |
| [`no-process-env-outside-config`](docs/rules/no-process-env-outside-config.md) | `problem` | Both | Disallow process.env reads outside configuration modules; import typed config instead |
| [`no-flag-argument`](docs/rules/no-flag-argument.md) | `suggestion` | Both | Disallow boolean flag arguments in function declarations; prefer explicit methods or command objects |
| [`prefer-guard-clauses`](docs/rules/prefer-guard-clauses.md) | `suggestion` | Both | Prefer guard clauses by disallowing else blocks when the if branch already terminates control flow |
| [`prefer-shortcut-return`](docs/rules/prefer-shortcut-return.md) | `suggestion` | Both | Prefer shortcut boolean returns by replacing if/return true-false patterns with direct return expressions |
| [`no-query-side-effects`](docs/rules/no-query-side-effects.md) | `suggestion` | Both | Disallow side effects in query-style functions (get*/is*/has*/can*/should*); separate query from modifier |
| [`require-exhaustive-switch`](docs/rules/require-exhaustive-switch.md) | `suggestion` | Both | Require exhaustive switch statements over finite union, enum, and boolean discriminants |
<!-- GENERATED:README_RULES_END -->

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

Coverage gates are enforced per-file at **95%** minimum across statements, branches, functions, and lines. The test command also refreshes the coverage badge automatically.

### README Sync

```bash
pnpm readme:sync
pnpm validate:readme
```

The root `README.md` rule catalog is generated from deterministic metadata in `scripts/metadata/readme-rule-catalog.json`, canonical rule source metadata, preset metadata from `packages/plugin/src/rules/support/rule-map.ts`, and rule docs page existence checks.

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

This monorepo provides automated scripts to handle versioned releases.

Quick release (single command):

```bash
pnpm release:prepare --release patch --commit --tag --publish
```

This will:

- bump the root, plugin, and config package versions
- replace `workspace:*` with a versioned peer dependency in `packages/config`
- run `pnpm build` and `pnpm test`
- create a release commit and annotated git tag
- publish both packages to npm

If you want to restore `workspace:*` after publishing for local development, run:

```bash
pnpm release:restore-workspace
```

Or include `--restore-workspace` and commit that restoration separately.

Manual/stepwise release flow:

```bash
# 1. Build all packages
pnpm build

# 2. Run tests to ensure everything works
pnpm test

# 3. Prepare packages for publishing (converts workspace:* to versioned dependency)
pnpm release:prepare

# 4. Publish the plugin package
cd packages/plugin
npm publish

# 5. Publish the config package
cd ../config
npm publish

# 6. Restore workspace:* for local development
cd ../..
pnpm release:restore-workspace
```

Additional `release:prepare` options:

```bash
# Bump versions and prepare manifests without publishing
pnpm release:prepare --release minor

# Skip build/test if already run in CI or a previous step
pnpm release:prepare --release 1.2.0 --skip-build --skip-test --commit --tag --publish

# Dry run the full flow
pnpm release:prepare --release patch --commit --tag --publish --dry-run
```

## License

Apache 2.0 Copyright Robert Lindley
