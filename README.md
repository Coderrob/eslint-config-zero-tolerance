# eslint-plugin-zero-tolerance

Zero-tolerance ESLint plugin and config for enforcing strict code quality standards in TypeScript projects.

[![npm version](https://img.shields.io/npm/v/eslint-plugin-zero-tolerance.svg)](https://www.npmjs.com/package/eslint-plugin-zero-tolerance)
[![License](https://img.shields.io/npm/l/eslint-plugin-zero-tolerance.svg)](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE)

**✨ Now supports ESLint 9 with Flat Config! ✨**

📖 **[Full documentation](https://coderrob.github.io/eslint-config-zero-tolerance/)**

## Packages

This monorepo contains two packages:

- `eslint-plugin-zero-tolerance` — ESLint plugin with 25 custom rules
- `eslint-config-zero-tolerance` — ESLint config that exports recommended and strict presets

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

All 25 rules are included in the `recommended` (`warn`) and `strict` (`error`) presets.

### Naming Conventions

| Rule | Description |
|---|---|
| [`require-interface-prefix`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/require-interface-prefix/) | Enforce that TypeScript interface names start with `I` |

### Documentation

| Rule | Description |
|---|---|
| [`require-jsdoc-functions`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/require-jsdoc-functions/) | Require JSDoc comments on all functions (except test files) |
| [`require-zod-schema-description`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/require-zod-schema-description/) | Enforce that Zod schemas have `.describe()` called |

### Testing

| Rule | Description |
|---|---|
| [`require-test-description-style`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/require-test-description-style/) | Enforce that test descriptions start with `should` |
| [`no-jest-have-been-called`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-jest-have-been-called/) | Prohibit `toHaveBeenCalled` and `toHaveBeenCalledWith`; use precise alternatives |
| [`no-mock-implementation`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-mock-implementation/) | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds |

### Type Safety

| Rule | Description |
|---|---|
| [`no-type-assertion`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-type-assertion/) | Prevent use of TypeScript `as` type assertions |
| [`no-non-null-assertion`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-non-null-assertion/) | Disallow non-null assertions using the `!` postfix operator |
| [`no-literal-unions`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-literal-unions/) | Ban literal union types in favour of enums |
| [`no-banned-types`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-banned-types/) | Ban `ReturnType` and indexed access types |

### Code Quality

| Rule | Description |
|---|---|
| [`max-function-lines`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/max-function-lines/) | Enforce a maximum number of lines per function body |
| [`max-params`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/max-params/) | Enforce a maximum number of function parameters |
| [`no-magic-numbers`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-magic-numbers/) | Disallow magic numbers; use named constants instead |
| [`no-magic-strings`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-magic-strings/) | Disallow magic strings in comparisons and switch cases |
| [`sort-imports`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/sort-imports/) | Require import declarations to be sorted alphabetically |
| [`sort-functions`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/sort-functions/) | Require top-level function declarations to be sorted alphabetically |

### Error Handling

| Rule | Description |
|---|---|
| [`no-empty-catch`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-empty-catch/) | Disallow empty catch blocks that silently swallow errors |
| [`no-throw-literal`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-throw-literal/) | Disallow throwing literals, objects, or templates; always throw a new Error instance |

### Imports

| Rule | Description |
|---|---|
| [`no-relative-parent-imports`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-relative-parent-imports/) | Ban `../` parent-directory imports and re-exports |
| [`no-dynamic-import`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-dynamic-import/) | Ban `await import()` and `require()` outside test files |
| [`no-export-alias`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-export-alias/) | Prevent use of aliases in export statements |

### Bug Prevention

| Rule | Description |
|---|---|
| [`no-identical-expressions`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-identical-expressions/) | Disallow identical expressions on both sides of a binary or logical operator |
| [`no-redundant-boolean`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-redundant-boolean/) | Disallow redundant comparisons to boolean literals |
| [`no-await-in-loop`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-await-in-loop/) | Disallow `await` inside loops; use `Promise.all()` instead |
| [`no-eslint-disable`](https://coderrob.github.io/eslint-config-zero-tolerance/rules/no-eslint-disable/) | Prevent use of `eslint-disable` comments |

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

## Publishing

This monorepo provides automated scripts to handle versioned releases:

```bash
# 1. Build all packages
pnpm build

# 2. Run tests to ensure everything works
pnpm test

# 3. Prepare packages for publishing (converts workspace:* to versioned dependencies)
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

## License

Apache 2.0 Copyright Robert Lindley
