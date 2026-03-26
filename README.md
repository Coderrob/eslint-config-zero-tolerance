<p align="center">
  <img
    src="public/img/zero-tolerance-icon.png"
    alt="ESLint Plugin Zero Tolerance"
  />
</p>

# @coderrob/eslint-plugin-zero-tolerance

Zero-tolerance ESLint plugin and config for enforcing strict code quality standards in TypeScript projects.

[![npm version](https://img.shields.io/npm/v/@coderrob/eslint-plugin-zero-tolerance.svg)](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance)
[![License](https://img.shields.io/npm/l/@coderrob/eslint-plugin-zero-tolerance.svg)](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-99.71%25-brightgreen)](packages/plugin/coverage/lcov-report/index.html)

**Now supports ESLint 8.57+, 9.x, and 10.x with Flat Config**

Documentation:

- Hosted docs: <https://coderrob.github.io/eslint-config-zero-tolerance/>
- Repository docs fallback: [`docs/index.md`](docs/index.md)
- Rules index fallback: [`docs/rules/index.md`](docs/rules/index.md)

## Packages

This monorepo contains two packages:

- `@coderrob/eslint-plugin-zero-tolerance` - ESLint plugin with custom rules
- `@coderrob/eslint-config-zero-tolerance` - ESLint config that exports recommended and strict presets

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

## Rules

Nearly all core rules are included in the `recommended` (`warn`) and `strict` (`error`) presets. `no-parent-imports` and `require-bdd-spec` remain available as opt-in rules.

### Naming Conventions

| Rule                                                                 | Description                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`require-interface-prefix`](docs/rules/require-interface-prefix.md) | Enforce that TypeScript interface names start with `I` followed by an uppercase letter |

### Documentation

| Rule                                                                   | Description                                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`require-bdd-spec`](docs/rules/require-bdd-spec.md)                   | Enforce that every TypeScript source file has a valid sibling .ts.bdd.json BDD spec |
| [`require-jsdoc-functions`](docs/rules/require-jsdoc-functions.md)     | Require JSDoc comments on all functions (except test files)                         |
| [`require-optional-chaining`](docs/rules/require-optional-chaining.md) | Require optional chaining instead of repeated guard access                          |
| [`require-readonly-props`](docs/rules/require-readonly-props.md)       | Require JSX component props to be typed as readonly                                 |

### Testing

| Rule                                                                             | Description                                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`require-test-description-style`](docs/rules/require-test-description-style.md) | Enforce that test descriptions start with `should`                                                            |
| [`no-jest-have-been-called`](docs/rules/no-jest-have-been-called.md)             | Prohibit imprecise call-assertion matchers; use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead |
| [`no-mock-implementation`](docs/rules/no-mock-implementation.md)                 | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds                                  |

### Type Safety

| Rule                                                           | Description                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| [`no-type-assertion`](docs/rules/no-type-assertion.md)         | Prevent use of TypeScript `as` and angle-bracket assertions |
| [`no-non-null-assertion`](docs/rules/no-non-null-assertion.md) | Disallow non-null assertions using the `!` postfix operator |
| [`no-literal-unions`](docs/rules/no-literal-unions.md)         | Ban literal union types in favour of enums                  |
| [`no-banned-types`](docs/rules/no-banned-types.md)             | Ban `ReturnType` and indexed access types                   |
| [`no-inline-type-import`](docs/rules/no-inline-type-import.md) | Disallow inline `import("...").Type` annotations            |

### Code Quality

| Rule                                                                     | Description                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [`max-function-lines`](docs/rules/max-function-lines.md)                 | Enforce a maximum number of lines per function body                   |
| [`max-params`](docs/rules/max-params.md)                                 | Enforce a maximum number of function parameters                       |
| [`no-array-mutation`](docs/rules/no-array-mutation.md)                   | Disallow mutating array methods                                       |
| [`no-date-now`](docs/rules/no-date-now.md)                               | Disallow `Date.now()` and no-arg `new Date()` usage                   |
| [`no-magic-numbers`](docs/rules/no-magic-numbers.md)                     | Disallow magic numbers; use named constants instead                   |
| [`no-magic-strings`](docs/rules/no-magic-strings.md)                     | Disallow magic strings in comparisons and switch cases                |
| [`no-object-mutation`](docs/rules/no-object-mutation.md)                 | Disallow direct object-property mutation                              |
| [`sort-imports`](docs/rules/sort-imports.md)                             | Require import declarations to be grouped and alphabetized            |
| [`sort-functions`](docs/rules/sort-functions.md)                         | Require top-level function declarations to be sorted alphabetically   |
| [`prefer-nullish-coalescing`](docs/rules/prefer-nullish-coalescing.md)   | Prefer nullish coalescing instead of repeated nullish guard ternaries |
| [`prefer-readonly-parameters`](docs/rules/prefer-readonly-parameters.md) | Prefer readonly typing for object and array-like parameters           |
| [`prefer-string-raw`](docs/rules/prefer-string-raw.md)                   | Prefer `String.raw` for strings containing escaped backslashes        |

### Error Handling

| Rule                                                         | Description                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [`no-empty-catch`](docs/rules/no-empty-catch.md)             | Disallow empty catch blocks that silently swallow errors                             |
| [`no-throw-literal`](docs/rules/no-throw-literal.md)         | Disallow throwing literals, objects, or templates; always throw a new Error instance |
| [`prefer-result-return`](docs/rules/prefer-result-return.md) | Prefer returning Result-style values instead of throwing                             |

### Imports

| Rule                                                   | Description                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| [`no-parent-imports`](docs/rules/no-parent-imports.md) | Ban `..` and `../*` parent-directory import traversal         |
| [`no-dynamic-import`](docs/rules/no-dynamic-import.md) | Ban dynamic `import()` and `require()` outside test files     |
| [`no-export-alias`](docs/rules/no-export-alias.md)     | Prevent use of aliases in export statements                   |
| [`no-re-export`](docs/rules/no-re-export.md)           | Disallow re-export statements from parent/grandparent modules |

### Bug Prevention

| Rule                                                                 | Description                                                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`no-identical-expressions`](docs/rules/no-identical-expressions.md) | Disallow identical expressions on both sides of a binary or logical operator |
| [`no-identical-branches`](docs/rules/no-identical-branches.md)       | Disallow identical branches in if/else and ternary conditionals              |
| [`no-boolean-return-trap`](docs/rules/no-boolean-return-trap.md)     | Disallow ambiguous boolean-return APIs outside predicate naming              |
| [`no-redundant-boolean`](docs/rules/no-redundant-boolean.md)         | Disallow redundant comparisons to boolean literals                           |
| [`no-for-in`](docs/rules/no-for-in.md)                               | Disallow `for..in` loops                                                     |
| [`no-labels`](docs/rules/no-labels.md)                               | Disallow labeled statements                                                  |
| [`no-with`](docs/rules/no-with.md)                                   | Disallow `with` statements                                                   |
| [`no-await-in-loop`](docs/rules/no-await-in-loop.md)                 | Disallow `await` inside loops; use `Promise.all()` instead                   |
| [`no-floating-promises`](docs/rules/no-floating-promises.md)         | Disallow unhandled promise expressions; require explicit handling            |
| [`no-eslint-disable`](docs/rules/no-eslint-disable.md)               | Prevent use of `eslint-disable` comments                                     |
| [`no-parameter-reassign`](docs/rules/no-parameter-reassign.md)       | Disallow reassigning function parameters                                     |
| [`no-flag-argument`](docs/rules/no-flag-argument.md)                 | Disallow boolean flag parameters in function signatures                      |
| [`prefer-guard-clauses`](docs/rules/prefer-guard-clauses.md)         | Prefer guard clauses by removing else blocks after terminating if branches   |
| [`prefer-shortcut-return`](docs/rules/prefer-shortcut-return.md)     | Prefer shortcut boolean returns over if branches that return true/false      |
| [`no-query-side-effects`](docs/rules/no-query-side-effects.md)       | Disallow side effects in query-style functions                               |

## Development

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

This also refreshes the coverage badge in `README.md` using coverage output in `packages/plugin/coverage/`.

Coverage gates are enforced in CI with a minimum of **95%** on:

- statements
- branches
- functions
- lines

### Dogfooding

The repository lints itself using its own plugin rules through [`eslint.config.mjs`](eslint.config.mjs).

```bash
pnpm eslint packages/plugin/src/rules
```

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
