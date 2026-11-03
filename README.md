<p align="center">
  <img src="public/img/zero-tolerance-icon.png" alt="Zero Tolerance ESLint plugin" width="200" />
</p>

# @coderrob/eslint-plugin-zero-tolerance

83 ESLint rules for readable TypeScript, reliable tests, and safer application code. Use individual rules or the existing recommended and strict configurations.

## What the plugin checks

- **Code quality:** function size, repeated expressions, mutation, and naming.
- **Async work:** missing waits, sequential loops, and IO timeout options.
- **Error handling:** lost error causes and unsafe throw patterns.
- **Tests:** persistent mocks, imprecise spy assertions, and assertions that may not run.
- **Project structure:** imports, exports, documentation, and type usage.

Checks have defined limits. Each [rule page](docs/rules/index.md) explains what is reported, gives examples, and describes cases the rule cannot resolve.

## Requirements

- ESLint 8.57.0+, 9.x, or 10.x.
- TypeScript-ESLint 8.x and TypeScript 5.x for TypeScript projects.
- A Node.js version supported by your ESLint version.

The repository's development prerequisites are listed in [CONTRIBUTING.md](CONTRIBUTING.md).

## Installation

```bash
npm install --save-dev @coderrob/eslint-plugin-zero-tolerance @typescript-eslint/parser
```

## Configuration

### Enable individual rules

This flat-config example enables selected checks for files in a TypeScript project:

```javascript
// eslint.config.mjs
import tsParser from '@typescript-eslint/parser';
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { projectService: true },
    },
    plugins: { 'zero-tolerance': zeroTolerance },
    rules: {
      'zero-tolerance/no-array-mutation': 'error',
      'zero-tolerance/require-timeout-for-io': 'error',
      'zero-tolerance/require-error-cause': 'error',
      'zero-tolerance/max-function-lines': ['error', { max: 30 }],
    },
  },
];
```

Use projectService when checking types from your TypeScript project. Without type information, rules such as no-array-mutation check only values they can identify from source syntax.

### Use an existing preset

For flat config, use zeroTolerance.configs.recommended or zeroTolerance.configs.strict. For ESLint 8 legacy config, use plugin:@coderrob/zero-tolerance/recommended or plugin:@coderrob/zero-tolerance/strict in extends. See the [configuration guide](docs/configuration.md) for complete setup examples and severity settings.

The require-error-cause rule is individually opt-in. The code-quality improvements do not change published presets.

## Choose and tune checks

Start with the rules that match your team's requirements. Review reported code before changing thresholds or allowing sequential work. Use the rule options to express intentional exceptions.

For promise handling, unsafe types, callback returns, and branching limits, see [additional code-quality checks](docs/configuration.md#additional-code-quality-checks-individual-opt-in).

## Product documentation

| Guide                                                                            | What you will find                            |
| -------------------------------------------------------------------------------- | --------------------------------------------- |
| [Getting started](docs/getting-started.md)                                       | Installation and initial setup.               |
| [Configuration](docs/configuration.md)                                           | Presets, individual rules, and options.       |
| [Rule reference](docs/rules/index.md)                                            | Behavior, examples, and limits for each rule. |
| [Hosted documentation](https://coderrob.github.io/eslint-config-zero-tolerance/) | The browsable documentation site.             |
| [Changelog](CHANGELOG.md)                                                        | Changes by release.                           |

## Packages

Only @coderrob/eslint-plugin-zero-tolerance is published to npm. The packages/config workspace is internal and supports development and compatibility testing.

## Rules

<!-- begin auto-generated rules list -->

The plugin ships **83 rules** across 8 categories. The grouped catalog below is exhaustive and links every rule to its dedicated documentation page.

Preset columns report the configured severity: 💼 for `error`, ⚠️ for `warn`, and 🚫 for `off`. A blank cell means the preset does not configure the rule.

| Category                                  | Rules | Focus                                               |
| ----------------------------------------- | ----: | --------------------------------------------------- |
| [Naming Conventions](#naming-conventions) |     1 | Interface naming standards                          |
| [Documentation](#documentation)           |     5 | JSDoc, BDD specs, optional chaining, readonly props |
| [Testing](#testing)                       |    13 | Assertions, mocks, timers, fetch, interfaces        |
| [Type Safety](#type-safety)               |    12 | Assertions, unions, imports, exported types         |
| [Code Quality](#code-quality)             |    16 | Function size, magic values, immutability, sorting  |
| [Error Handling](#error-handling)         |     4 | Throw safety, empty catches, Result patterns        |
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
| [require-optional-chaining](docs/rules/require-optional-chaining.md)                 | 📖  |     |     | R S | Report repeated logical guard access for manual review                                                                  |
| [require-readonly-props](docs/rules/require-readonly-props.md)                       | 📖  | S   | R   |     | Require readonly typing for JSX component props                                                                         |

### Testing

Assertions, mocks, timers, fetch, interfaces

| Name                                                                                   | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                             |
| :------------------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :---------------------------------------------------------------------------------------------------------------------- |
| [no-chai-imprecise-spy-assertions](docs/rules/no-chai-imprecise-spy-assertions.md)     | 📖  | S   | R   |     | Require exact Chai-style spy call counts and invocation arguments                                                       |
| [no-conditional-test-assertion](docs/rules/no-conditional-test-assertion.md)           | ❗  | S   | R   |     | Disallow assertions in test branches that may not execute                                                               |
| [no-fetch-in-tests](docs/rules/no-fetch-in-tests.md)                                   | 📖  |     |     | R S | Disallow fetch usage in test files                                                                                      |
| [no-jest-have-been-called](docs/rules/no-jest-have-been-called.md)                     | 📖  | S   | R   |     | Require exact call counts and invocation indices in Jest expect assertions, while allowing negated zero-call assertions |
| [no-mock-implementation](docs/rules/no-mock-implementation.md)                         | 📖  | S   | R   |     | Prohibit persistent mock implementations; use the Once variants to avoid test bleeds                                    |
| [no-restricted-imports-in-tests](docs/rules/no-restricted-imports-in-tests.md)         | 📖  |     |     | R S | Disallow restricted dependency imports in test files                                                                    |
| [no-set-interval-in-tests](docs/rules/no-set-interval-in-tests.md)                     | 📖  | S   | R   |     | Disallow setInterval usage in test files                                                                                |
| [no-set-timeout-in-tests](docs/rules/no-set-timeout-in-tests.md)                       | 📖  | S   | R   |     | Disallow setTimeout usage in test files                                                                                 |
| [no-sinon-imprecise-spy-assertions](docs/rules/no-sinon-imprecise-spy-assertions.md)   | 📖  | S   | R   |     | Require exact Sinon spy call counts and invocation arguments                                                            |
| [no-test-interface-declaration](docs/rules/no-test-interface-declaration.md)           | 📖  | S   | R   |     | Disallow interface declarations in test files; import production types instead                                          |
| [no-unawaited-async-assertion](docs/rules/no-unawaited-async-assertion.md)             | ❗  | S   | R   |     | Require asynchronous test assertions to be awaited or returned                                                          |
| [no-vitest-imprecise-spy-assertions](docs/rules/no-vitest-imprecise-spy-assertions.md) | 📖  | S   | R   |     | Require exact Vitest spy call counts and invocation indices                                                             |
| [require-test-description-style](docs/rules/require-test-description-style.md)         | 📖  | S   | R   |     | Enforce that test descriptions start with "should"                                                                      |

### Type Safety

Assertions, unions, imports, exported types

| Name                                                                                           | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                                                |
| :--------------------------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :------------------------------------------------------------------------------------------------------------------------- |
| [no-destructured-parameter-type-literal](docs/rules/no-destructured-parameter-type-literal.md) | 📖  | S   | R   |     | Disallow inline object type literals on destructured parameters; require a named type instead                              |
| [no-explicit-any](docs/rules/no-explicit-any.md)                                               | ❗  | S   | R   |     | Disallow explicit any; model unknown values precisely and narrow them explicitly                                           |
| [no-indexed-access-types](docs/rules/no-indexed-access-types.md)                               | ❗  | S   | R   |     | Disallow TypeScript indexed access types                                                                                   |
| [no-inline-type-import](docs/rules/no-inline-type-import.md)                                   | ❗  | S   | R   |     | Disallow TypeScript inline type imports using import("...")                                                                |
| [no-literal-property-unions](docs/rules/no-literal-property-unions.md)                         | 📖  | S   | R   |     | Require property literal unions to use named domain types                                                                  |
| [no-literal-unions](docs/rules/no-literal-unions.md)                                           | 📖  | S   | R   |     | Report literal unions for manual migration to enums                                                                        |
| [no-non-null-assertion](docs/rules/no-non-null-assertion.md)                                   | ❗  | S   | R   |     | Disallow non-null assertions using the "!" postfix operator                                                                |
| [no-return-type](docs/rules/no-return-type.md)                                                 | ❗  | S   | R   |     | Disallow TypeScript ReturnType utility usage                                                                               |
| [no-type-assertion](docs/rules/no-type-assertion.md)                                           | 📖  | S   | R   |     | Prevent use of TypeScript "as" type assertions                                                                             |
| [no-unsafe-json-parse](docs/rules/no-unsafe-json-parse.md)                                     | ❗  | S   | R   |     | Disallow treating JSON.parse results as typed data without validation                                                      |
| [require-exported-object-type](docs/rules/require-exported-object-type.md)                     | 📖  | S   | R   |     | Require exported object constants to declare an explicit type annotation                                                   |
| [require-union-type-alias](docs/rules/require-union-type-alias.md)                             | 📖  | S   | R   |     | Require inline union types with three or more members and multiple type references to be extracted into named type aliases |

### Code Quality

Function size, magic values, immutability, sorting

| Name                                                                         | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                          |
| :--------------------------------------------------------------------------- | :-- | :-- | :-- | :-- | :--------------------------------------------------------------------------------------------------- |
| [max-function-lines](docs/rules/max-function-lines.md)                       | 📖  | S   | R   |     | Limit block and expression function bodies with optional blank/comment exclusions                    |
| [max-params](docs/rules/max-params.md)                                       | 📖  | S   | R   |     | Enforce a maximum number of function parameters                                                      |
| [no-array-mutation](docs/rules/no-array-mutation.md)                         | 📖  | S   | R   |     | Disallow mutating methods on known arrays and tuples                                                 |
| [no-date-now](docs/rules/no-date-now.md)                                     | 📖  | S   | R   |     | Disallow Date.now() and new Date(); prefer injected clocks for deterministic behavior                |
| [no-magic-numbers](docs/rules/no-magic-numbers.md)                           | 📖  | S   | R   |     | Disallow magic numbers; use named constants instead of raw numeric literals                          |
| [no-magic-strings](docs/rules/no-magic-strings.md)                           | 📖  | S   | R   |     | Disallow magic strings in comparisons and switch cases; use named constants instead                  |
| [no-map-set-mutation](docs/rules/no-map-set-mutation.md)                     | 📖  | S   | R   |     | Disallow direct Map and Set mutation methods; rebuild collections instead of mutating them in place  |
| [no-object-mutation](docs/rules/no-object-mutation.md)                       | 📖  | S   | R   |     | Disallow direct object-property mutation; prefer creating new objects with immutable update patterns |
| [no-placeholder-implementation](docs/rules/no-placeholder-implementation.md) | ❗  | S   | R   |     | Disallow placeholder, stub, TODO, and not implemented production code                                |
| [prefer-nullish-coalescing](docs/rules/prefer-nullish-coalescing.md)         | 📖  | S   | R   |     | Prefer nullish coalescing for locally bound identifier guard ternaries                               |
| [prefer-object-spread](docs/rules/prefer-object-spread.md)                   | 📖  |     |     | R S | Report empty-target Object.assign calls for manual review before using object spread                 |
| [prefer-readonly-parameters](docs/rules/prefer-readonly-parameters.md)       | 📖  | S   | R   |     | Prefer readonly typing for object and array-like parameters to prevent accidental mutation of inputs |
| [prefer-string-raw](docs/rules/prefer-string-raw.md)                         | 📖  | S   | R   |     | Prefer native String.raw for eligible escaped string literals                                        |
| [prefer-structured-clone](docs/rules/prefer-structured-clone.md)             | 📖  |     |     | R S | Review JSON.parse(JSON.stringify(...)) before considering structuredClone(...)                       |
| [sort-functions](docs/rules/sort-functions.md)                               | 📖  | S   | R   |     | Require top-level functions to be sorted alphabetically                                              |
| [sort-imports](docs/rules/sort-imports.md)                                   | 📖  | S   | R   |     | Require grouped alphabetical imports without changing runtime dependency order                       |

### Error Handling

Throw safety, empty catches, Result patterns

| Name                                                       | 🗂️  | 💼  | ⚠️  | 🚫  | Description                                                                                               |
| :--------------------------------------------------------- | :-- | :-- | :-- | :-- | :-------------------------------------------------------------------------------------------------------- |
| [no-empty-catch](docs/rules/no-empty-catch.md)             | ❗  | S   | R   |     | Disallow empty catch blocks that silently swallow errors                                                  |
| [no-throw-literal](docs/rules/no-throw-literal.md)         | ❗  | S   | R   |     | Disallow throwing literals, objects, or templates; always throw a new Error instance                      |
| [prefer-result-return](docs/rules/prefer-result-return.md) | 📖  |     | S   | R   | Prefer Result-style return values instead of throw statements to make error flows explicit and composable |
| [require-error-cause](docs/rules/require-error-cause.md)   | ❗  |     |     |     | Preserve the caught exception when throwing a replacement error                                           |

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
| [no-await-in-loop](docs/rules/no-await-in-loop.md)                           | ❗  | S   | R   |     | Review await inside loops with configurable sequential-work exceptions                                        |
| [no-boolean-return-trap](docs/rules/no-boolean-return-trap.md)               | 📖  | S   | R   |     | Disallow ambiguous boolean-return APIs; prefer predicate naming or richer result types for clearer call sites |
| [no-eslint-disable](docs/rules/no-eslint-disable.md)                         | 📖  | S   | R   |     | Prevent use of eslint-disable comments                                                                        |
| [no-flag-argument](docs/rules/no-flag-argument.md)                           | 📖  | S   | R   |     | Disallow boolean flag arguments in function declarations; prefer explicit methods or command objects          |
| [no-floating-promises](docs/rules/no-floating-promises.md)                   | ❗  | S   | R   |     | Require handling of explicit, local async, and type-resolved promises                                         |
| [no-for-in](docs/rules/no-for-in.md)                                         | ❗  | S   | R   |     | Disallow for..in loops; use Object.keys/values/entries to avoid prototype-chain iteration                     |
| [no-identical-branches](docs/rules/no-identical-branches.md)                 | 📖  | S   | R   |     | Disallow identical if/else and conditional-expression branches; consolidate duplicate conditional fragments   |
| [no-identical-expressions](docs/rules/no-identical-expressions.md)           | ❗  | S   | R   |     | Report repeated stable operands in comparisons and logical expressions                                        |
| [no-labels](docs/rules/no-labels.md)                                         | ❗  | S   | R   |     | Disallow labels because they make control flow harder to reason about                                         |
| [no-math-random](docs/rules/no-math-random.md)                               | ❗  | S   | R   |     | Disallow Math.random(); inject randomness explicitly or use a dedicated random source                         |
| [no-parameter-reassign](docs/rules/no-parameter-reassign.md)                 | 📖  | S   | R   |     | Disallow assignments and updates to function parameters; use a new local variable instead                     |
| [no-process-env-outside-config](docs/rules/no-process-env-outside-config.md) | ❗  | S   | R   |     | Disallow process.env reads outside configuration modules; import typed config instead                         |
| [no-query-side-effects](docs/rules/no-query-side-effects.md)                 | 📖  | S   | R   |     | Disallow observable mutation in query functions while allowing local computation                              |
| [no-redundant-boolean](docs/rules/no-redundant-boolean.md)                   | 📖  | S   | R   |     | Disallow redundant comparisons to boolean literals (Sonar S1125)                                              |
| [no-ts-nocheck](docs/rules/no-ts-nocheck.md)                                 | ❗  | S   | R   |     | Prevent use of @ts-nocheck comments                                                                           |
| [no-with](docs/rules/no-with.md)                                             | ❗  | S   | R   |     | Disallow with statements because they make scope resolution unpredictable                                     |
| [prefer-guard-clauses](docs/rules/prefer-guard-clauses.md)                   | 📖  | S   | R   |     | Prefer guard clauses by disallowing else blocks when the if branch already terminates control flow            |
| [prefer-shortcut-return](docs/rules/prefer-shortcut-return.md)               | 📖  | S   | R   |     | Prefer shortcut boolean returns while preserving comments                                                     |
| [require-exhaustive-switch](docs/rules/require-exhaustive-switch.md)         | 📖  | S   | R   |     | Require exhaustive switch statements over finite union, enum, and boolean discriminants                       |
| [require-timeout-for-io](docs/rules/require-timeout-for-io.md)               | ❗  | S   | R   |     | Require API-specific timeout or cancellation options for external IO calls                                    |

<!-- end auto-generated rules list -->

## Repository development

### Dogfooding

This repository applies its plugin through [eslint.config.mjs](eslint.config.mjs). The seven updated rules are explicitly enabled as errors for TypeScript source and repository scripts, including the opt-in require-error-cause rule.

| Files              | Enforcement                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript source  | Existing strict rules plus the explicit repository checks; function bodies are limited to 15 lines.                                                     |
| Repository scripts | The seven updated rules plus shared correctness checks; function bodies use the rule's 30-line default.                                                 |
| Tests              | Existing test-specific exceptions remain: function length and checks requiring a TypeScript project are disabled. IO checks skip test files by default. |

CI runs pnpm lint, which builds the plugin before applying it. Configuration tests verify that the updated rules are enabled and report representative violations. Public presets are unchanged by this repository configuration.

### Validate changes

```bash
pnpm install
pnpm lint
pnpm test
pnpm --filter @coderrob/eslint-plugin-zero-tolerance exec tsc -p tsconfig.json --noEmit
pnpm --filter @coderrob/eslint-config-zero-tolerance exec tsc -p tsconfig.json --noEmit
```

Rule tests include accepted and rejected cases, behavior-based names, explicit diagnostics, and autofix outputs where applicable. Coverage thresholds are at least 95% for each rule. See the [contributor guide](CONTRIBUTING.md) for all requirements.

File-based contracts in [test/consumers/rule-contracts](test/consumers/rule-contracts/README.md) run the built plugin against known violations and matching valid files. They verify exact diagnostics and run with `pnpm test`.

### Keep the rule catalog current

```bash
pnpm readme:sync
pnpm validate:readme
```

The rule catalog is generated from the built plugin and scripts/metadata/readme-rule-catalog.json. Update rule pages and BDD specifications when behavior changes.

## Releases

Only the plugin package is published. Follow the [release process](CONTRIBUTING.md#publishing) to prepare a version, review its changelog, and publish through GitHub Actions.

## License

Apache 2.0 Copyright Robert Lindley
