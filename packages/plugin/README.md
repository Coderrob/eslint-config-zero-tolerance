# @coderrob/eslint-plugin-zero-tolerance

Strict, opinionated ESLint plugin for TypeScript that enforces type safety, code quality, testing standards, and maintainable patterns with zero exceptions.

[![npm version](https://img.shields.io/npm/v/@coderrob/eslint-plugin-zero-tolerance.svg)](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance)
[![License](https://img.shields.io/npm/l/@coderrob/eslint-plugin-zero-tolerance.svg)](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE)

## Features

- 46 custom ESLint rules covering type safety, code quality, testing, imports, and bug prevention
- `recommended` preset (enabled default rules at `warn`) and `strict` preset (enabled default rules at `error`)
- ESLint 9 flat config and ESLint 8.x legacy config support
- Built with `@typescript-eslint/utils` for TypeScript AST support

## Requirements

- Node.js >= 18
- ESLint 8.57.0+ or 9.x
- `@typescript-eslint/parser` 8.x
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

export default [zeroTolerance.configs.recommended];
```

### ESLint 8.x (Legacy Config)

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['zero-tolerance'],
  extends: ['plugin:zero-tolerance/legacy-recommended'],
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

| Rule                        | Description                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `require-bdd-spec`          | Enforce that every TypeScript source file has a valid sibling .ts.bdd.json BDD spec |
| `require-jsdoc-functions`   | Require JSDoc comments on all functions (except test files)                         |
| `require-optional-chaining` | Require optional chaining instead of repeated guard access                          |
| `require-readonly-props`    | Require JSX component props to be typed as readonly                                 |

### Testing

| Rule                             | Description                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `require-test-description-style` | Enforce that test descriptions start with `should`                                                            |
| `no-jest-have-been-called`       | Prohibit imprecise call-assertion matchers; use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead |
| `no-mock-implementation`         | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds                                  |

### Type Safety

| Rule                    | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `no-type-assertion`     | Prevent use of TypeScript `as` and angle-bracket assertions |
| `no-non-null-assertion` | Disallow non-null assertions using the `!` postfix operator |
| `no-literal-unions`     | Ban literal union types in favour of enums                  |
| `no-banned-types`       | Ban `ReturnType` and indexed access types                   |
| `no-inline-type-import` | Disallow inline `import("...").Type` annotations            |

### Code Quality

| Rule                         | Description                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `max-function-lines`         | Enforce a maximum number of lines per function body                                     |
| `max-params`                 | Enforce a maximum number of function parameters                                         |
| `no-array-mutation`          | Disallow mutating array methods                                                         |
| `no-date-now`                | Disallow `Date.now()` and no-arg `new Date()` usage                                     |
| `no-magic-numbers`           | Disallow magic numbers; use named constants instead                                     |
| `no-magic-strings`           | Disallow magic strings in comparisons and switch cases                                  |
| `no-object-mutation`         | Disallow direct object-property mutation                                                |
| `sort-imports`               | Require import declarations to be ordered by group and alphabetically within each group |
| `sort-functions`             | Require top-level functions and const function expressions to be sorted alphabetically  |
| `prefer-nullish-coalescing`  | Prefer nullish coalescing instead of repeated nullish guard ternaries                   |
| `prefer-readonly-parameters` | Prefer readonly typing for object and array-like parameters                             |
| `prefer-string-raw`          | Prefer `String.raw` for strings containing escaped backslashes                          |

### Error Handling

| Rule                   | Description                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `no-empty-catch`       | Disallow empty catch blocks that silently swallow errors                               |
| `no-throw-literal`     | Disallow throwing literals, objects, or templates; always throw a new `Error` instance |
| `prefer-result-return` | Prefer returning Result-style values instead of throwing                               |

### Imports

| Rule                | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `no-parent-imports` | Disallow parent-directory traversal in import paths           |
| `no-dynamic-import` | Ban dynamic `import()` and `require()` outside test files     |
| `no-export-alias`   | Prevent use of aliases in export statements                   |
| `no-re-export`      | Disallow re-export statements from parent/grandparent modules |

### Bug Prevention

| Rule                       | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `no-identical-expressions` | Disallow identical expressions on both sides of a binary or logical operator |
| `no-identical-branches`    | Disallow identical conditional branches                                      |
| `no-boolean-return-trap`   | Disallow ambiguous boolean-return APIs outside predicate naming              |
| `no-redundant-boolean`     | Disallow redundant comparisons to boolean literals                           |
| `no-for-in`                | Disallow `for..in` loops                                                     |
| `no-labels`                | Disallow labeled statements                                                  |
| `no-with`                  | Disallow `with` statements                                                   |
| `no-await-in-loop`         | Disallow `await` inside loops; use `Promise.all()` instead                   |
| `no-floating-promises`     | Disallow unhandled promise expressions; require explicit handling            |
| `no-eslint-disable`        | Prevent use of `eslint-disable` comments                                     |
| `no-parameter-reassign`    | Disallow reassigning function parameters                                     |
| `no-flag-argument`         | Disallow boolean flag parameters in function signatures                      |
| `prefer-guard-clauses`     | Prefer guard clauses by removing else blocks after terminating if branches   |
| `prefer-shortcut-return`   | Prefer shortcut boolean returns over if branches that return true/false      |
| `no-query-side-effects`    | Disallow side effects in query-style functions                               |

## Documentation

Full rule documentation with examples is available at:

<https://coderrob.github.io/eslint-config-zero-tolerance/>

## License

[Apache 2.0](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/LICENSE) Copyright Robert Lindley
