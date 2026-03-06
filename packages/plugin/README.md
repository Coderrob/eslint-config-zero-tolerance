# @coderrob/eslint-plugin-zero-tolerance

Strict, opinionated ESLint plugin for TypeScript — enforcing type safety, code quality, testing standards, and maintainable patterns with zero exceptions.

[![npm version](https://img.shields.io/npm/v/@coderrob/eslint-plugin-zero-tolerance.svg)](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance)
[![License](https://img.shields.io/npm/l/@coderrob/eslint-plugin-zero-tolerance.svg)](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE)

## Features

- 26 custom ESLint rules covering type safety, code quality, testing, imports, and more
- **Recommended** preset (all rules at `warn`) and **Strict** preset (all rules at `error`)
- ESLint 9 Flat Config and ESLint 8.x legacy config support
- Built with `@typescript-eslint/utils` for full TypeScript AST support

## Requirements

- Node.js >= 18
- ESLint 8.57.0+ or 9.x
- TypeScript-ESLint Parser 8.x
- TypeScript 5.x

## Installation

```bash
npm install --save-dev @coderrob/eslint-plugin-zero-tolerance @typescript-eslint/parser
```

## Quick Start

### ESLint 9+ (Flat Config)

```javascript
// eslint.config.js
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.recommended, // or zeroTolerance.configs.strict
];
```

### ESLint 8.x (Legacy Config)

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['zero-tolerance'],
  extends: ['plugin:zero-tolerance/legacy-recommended'],
  // or: extends: ['plugin:zero-tolerance/legacy-strict'],
};
```

### Custom Rule Selection

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
    },
  },
];
```

## Presets

| Preset             | Severity | Config Key            |
| ------------------ | -------- | --------------------- |
| Recommended        | `warn`   | `configs.recommended` |
| Strict             | `error`  | `configs.strict`      |
| Legacy Recommended | `warn`   | `legacy-recommended`  |
| Legacy Strict      | `error`  | `legacy-strict`       |

## Rules

### Naming Conventions

| Rule                       | Description                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `require-interface-prefix` | Enforce that TypeScript interface names start with `I` followed by an uppercase letter |

### Documentation

| Rule                             | Description                                                 |
| -------------------------------- | ----------------------------------------------------------- |
| `require-jsdoc-functions`        | Require JSDoc comments on all functions (except test files) |
| `require-optional-chaining`      | Require optional chaining instead of repeated guard access  |
| `require-zod-schema-description` | Enforce that Zod schemas have `.describe()` called          |

### Testing

| Rule                             | Description                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `require-test-description-style` | Enforce that test descriptions start with `should`                                                  |
| `no-jest-have-been-called`       | Prohibit imprecise call-assertion matchers; use `toHaveBeenCalledTimes` / `toHaveBeenNthCalledWith` |
| `no-mock-implementation`         | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds                        |

### Type Safety

| Rule                    | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `no-type-assertion`     | Prevent use of TypeScript `as` type assertions              |
| `no-non-null-assertion` | Disallow non-null assertions using the `!` postfix operator |
| `no-literal-unions`     | Ban literal union types in favour of enums                  |
| `no-banned-types`       | Ban `ReturnType` and indexed access types                   |

### Code Quality

| Rule                 | Description                                                         |
| -------------------- | ------------------------------------------------------------------- |
| `max-function-lines` | Enforce a maximum number of lines per function body                 |
| `max-params`         | Enforce a maximum number of function parameters                     |
| `no-magic-numbers`   | Disallow magic numbers; use named constants instead                 |
| `no-magic-strings`   | Disallow magic strings in comparisons and switch cases              |
| `sort-imports`       | Require import declarations to be sorted alphabetically             |
| `sort-functions`     | Require top-level function declarations to be sorted alphabetically |

### Error Handling

| Rule               | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| `no-empty-catch`   | Disallow empty catch blocks that silently swallow errors                               |
| `no-throw-literal` | Disallow throwing literals, objects, or templates; always throw a new `Error` instance |

### Imports

| Rule                | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `no-re-export`      | Ban `../` parent-directory imports and re-exports       |
| `no-dynamic-import` | Ban `await import()` and `require()` outside test files |
| `no-export-alias`   | Prevent use of aliases in export statements             |

### Bug Prevention

| Rule                       | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `no-identical-expressions` | Disallow identical expressions on both sides of a binary or logical operator |
| `no-redundant-boolean`     | Disallow redundant comparisons to boolean literals                           |
| `no-await-in-loop`         | Disallow `await` inside loops; use `Promise.all()` instead                   |
| `no-eslint-disable`        | Prevent use of `eslint-disable` comments                                     |

## Documentation

Full rule documentation with examples is available at:

<https://coderrob.github.io/eslint-config-zero-tolerance/>

## License

[Apache 2.0](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE) — Copyright Robert Lindley
