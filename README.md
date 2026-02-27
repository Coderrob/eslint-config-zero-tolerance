<p align="center">
  <img
    src="public/img/zero-tolerance-icon.png"
    alt="ESLint Plugin Zero Tolerance"
  />
</p>

# eslint-plugin-zero-tolerance

Zero-tolerance ESLint plugin and config for enforcing strict code quality standards in TypeScript projects.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-zero-tolerance.svg)](https://www.npmjs.com/package/eslint-plugin-zero-tolerance)
[![License](https://img.shields.io/npm/l/eslint-plugin-zero-tolerance.svg)](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-98.56%25-brightgreen)](packages/plugin/coverage/lcov-report/index.html)

**Now supports ESLint 9 with Flat Config**

Documentation:

- Hosted docs: <https://coderrob.github.io/eslint-config-zero-tolerance/>
- Repository docs fallback: [`docs/index.md`](docs/index.md)
- Rules index fallback: [`docs/rules/index.md`](docs/rules/index.md)

## Packages

This monorepo contains two packages:

- `eslint-plugin-zero-tolerance` - ESLint plugin with custom rules
- `eslint-config-zero-tolerance` - ESLint config that exports recommended and strict presets

## Requirements

- ESLint 8.57.0+ or 9.x
- TypeScript-ESLint 8.x
- TypeScript 5.x

## Installation

```bash
npm install --save-dev eslint-plugin-zero-tolerance @typescript-eslint/parser
```

## Usage

### ESLint 9+ (Flat Config)

**Using the recommended preset:**

```javascript
// eslint.config.js
import zeroTolerance from 'eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.recommended,
  // your other configs...
];
```

**Using the strict preset:**

```javascript
// eslint.config.js
import zeroTolerance from 'eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.strict,
  // your other configs...
];
```

**Alternative: Import presets directly from the config package:**

```javascript
// eslint.config.js
import recommended from 'eslint-config-zero-tolerance/recommended';
// or
import strict from 'eslint-config-zero-tolerance/strict';

export default [
  recommended, // or strict
  // your other configs...
];
```

**Custom configuration:**

```javascript
// eslint.config.js
import zeroTolerance from 'eslint-plugin-zero-tolerance';

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

All rules are included in the `recommended` (`warn`) and `strict` (`error`) presets.

### Naming Conventions

| Rule                                                                 | Description                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`require-interface-prefix`](docs/rules/require-interface-prefix.md) | Enforce that TypeScript interface names start with `I` followed by an uppercase letter |

### Documentation

| Rule                                                                             | Description                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`require-jsdoc-functions`](docs/rules/require-jsdoc-functions.md)               | Require JSDoc comments on all functions (except test files) |
| [`require-optional-chaining`](docs/rules/require-optional-chaining.md)           | Require optional chaining instead of repeated guard access  |
| [`require-zod-schema-description`](docs/rules/require-zod-schema-description.md) | Enforce that Zod schemas have `.describe()` called          |

### Testing

| Rule                                                                             | Description                                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`require-test-description-style`](docs/rules/require-test-description-style.md) | Enforce that test descriptions start with `should`                                                            |
| [`no-jest-have-been-called`](docs/rules/no-jest-have-been-called.md)             | Prohibit imprecise call-assertion matchers; use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead |
| [`no-mock-implementation`](docs/rules/no-mock-implementation.md)                 | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds                                  |

### Type Safety

| Rule                                                           | Description                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| [`no-type-assertion`](docs/rules/no-type-assertion.md)         | Prevent use of TypeScript `as` type assertions              |
| [`no-non-null-assertion`](docs/rules/no-non-null-assertion.md) | Disallow non-null assertions using the `!` postfix operator |
| [`no-literal-unions`](docs/rules/no-literal-unions.md)         | Ban literal union types in favour of enums                  |
| [`no-banned-types`](docs/rules/no-banned-types.md)             | Ban `ReturnType` and indexed access types                   |

### Code Quality

| Rule                                                     | Description                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| [`max-function-lines`](docs/rules/max-function-lines.md) | Enforce a maximum number of lines per function body                 |
| [`max-params`](docs/rules/max-params.md)                 | Enforce a maximum number of function parameters                     |
| [`no-magic-numbers`](docs/rules/no-magic-numbers.md)     | Disallow magic numbers; use named constants instead                 |
| [`no-magic-strings`](docs/rules/no-magic-strings.md)     | Disallow magic strings in comparisons and switch cases              |
| [`sort-imports`](docs/rules/sort-imports.md)             | Require import declarations to be sorted alphabetically             |
| [`sort-functions`](docs/rules/sort-functions.md)         | Require top-level function declarations to be sorted alphabetically |

### Error Handling

| Rule                                                 | Description                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`no-empty-catch`](docs/rules/no-empty-catch.md)     | Disallow empty catch blocks that silently swallow errors                             |
| [`no-throw-literal`](docs/rules/no-throw-literal.md) | Disallow throwing literals, objects, or templates; always throw a new Error instance |

### Imports

| Rule                                                                     | Description                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------- |
| [`no-relative-parent-imports`](docs/rules/no-relative-parent-imports.md) | Ban `../` parent-directory imports and re-exports       |
| [`no-dynamic-import`](docs/rules/no-dynamic-import.md)                   | Ban `await import()` and `require()` outside test files |
| [`no-export-alias`](docs/rules/no-export-alias.md)                       | Prevent use of aliases in export statements             |

### Bug Prevention

| Rule                                                                 | Description                                                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`no-identical-expressions`](docs/rules/no-identical-expressions.md) | Disallow identical expressions on both sides of a binary or logical operator |
| [`no-redundant-boolean`](docs/rules/no-redundant-boolean.md)         | Disallow redundant comparisons to boolean literals                           |
| [`no-await-in-loop`](docs/rules/no-await-in-loop.md)                 | Disallow `await` inside loops; use `Promise.all()` instead                   |
| [`no-eslint-disable`](docs/rules/no-eslint-disable.md)               | Prevent use of `eslint-disable` comments                                     |

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

### Type Checking

```bash
pnpm --filter eslint-plugin-zero-tolerance exec tsc -p tsconfig.json --noEmit
pnpm --filter eslint-config-zero-tolerance exec tsc -p tsconfig.json --noEmit
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
pnpm prepare-publish --release patch --commit --tag --publish
```

This will:

- bump the root, plugin, and config package versions
- replace `workspace:*` with a versioned peer dependency in `packages/config`
- run `pnpm build` and `pnpm test`
- create a release commit and annotated git tag
- publish both packages to npm

If you want to restore `workspace:*` after publishing for local development, run:

```bash
pnpm restore-workspace
```

Or include `--restore-workspace` and commit that restoration separately.

Manual/stepwise release flow:

```bash
# 1. Build all packages
pnpm build

# 2. Run tests to ensure everything works
pnpm test

# 3. Prepare packages for publishing (converts workspace:* to versioned dependency)
pnpm prepare-publish

# 4. Publish the plugin package
cd packages/plugin
npm publish

# 5. Publish the config package
cd ../config
npm publish

# 6. Restore workspace:* for local development
cd ../..
pnpm restore-workspace
```

Additional `prepare-publish` options:

```bash
# Bump versions and prepare manifests without publishing
pnpm prepare-publish --release minor

# Skip build/test if already run in CI or a previous step
pnpm prepare-publish --release 1.2.0 --skip-build --skip-test --commit --tag --publish

# Dry run the full flow
pnpm prepare-publish --release patch --commit --tag --publish --dry-run
```

## License

Apache 2.0 Copyright Robert Lindley
