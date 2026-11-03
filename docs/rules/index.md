# Rules

Rule suites require nonempty valid and invalid fixtures, named `should` cases, explicit diagnostics, and concrete autofix outputs. All 83 rules also run against shared TypeScript, JSX, optional-access, and Jest-chain parsing fixtures. See [the contributor guide](https://github.com/Coderrob/eslint-config-zero-tolerance/blob/main/CONTRIBUTING.md) for validation requirements.

`@coderrob/eslint-plugin-zero-tolerance` provides **83 custom rules** grouped into eight categories. Each rule links to a dedicated page with rationale, correct/incorrect examples, and configuration options.

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

---

## Naming Conventions

| Rule                                                    | Type       | Description                                 |
| ------------------------------------------------------- | ---------- | ------------------------------------------- |
| [require-interface-prefix](require-interface-prefix.md) | suggestion | Enforce that interface names start with `I` |

## Documentation

| Rule                                                                      | Type       | Description                                                                                             |
| ------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| [require-bdd-spec](require-bdd-spec.md)                                   | suggestion | Enforce that every TypeScript source file has a valid sibling .ts.bdd.json BDD spec                     |
| [require-jsdoc-anonymous-functions](require-jsdoc-anonymous-functions.md) | suggestion | Require JSDoc comments on anonymous function-like constructs except test files and known test callbacks |
| [require-jsdoc-functions](require-jsdoc-functions.md)                     | suggestion | Require JSDoc comments on named functions (except test files)                                           |
| [require-optional-chaining](require-optional-chaining.md)                 | suggestion | Report repeated logical guard access for manual review                                                  |
| [require-readonly-props](require-readonly-props.md)                       | suggestion | Require JSX component props to be typed as readonly                                                     |

## Testing

| Rule                                                                        | Type       | Description                                                                                         |
| --------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| [require-test-description-style](require-test-description-style.md)         | suggestion | Enforce that test descriptions start with `should`                                                  |
| [no-chai-imprecise-spy-assertions](no-chai-imprecise-spy-assertions.md)     | suggestion | Require exact Chai-style spy call counts and invocation arguments                                   |
| [no-conditional-test-assertion](no-conditional-test-assertion.md)           | problem    | Disallow assertions in test branches that may not execute                                           |
| [no-jest-have-been-called](no-jest-have-been-called.md)                     | suggestion | Require exact call counts and invocation indices in Jest assertions; allow negated zero-call checks |
| [no-mock-implementation](no-mock-implementation.md)                         | suggestion | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds                        |
| [no-sinon-imprecise-spy-assertions](no-sinon-imprecise-spy-assertions.md)   | suggestion | Require exact Sinon spy call counts and invocation arguments                                        |
| [no-set-timeout-in-tests](no-set-timeout-in-tests.md)                       | suggestion | Disallow `setTimeout` usage in test files                                                           |
| [no-set-interval-in-tests](no-set-interval-in-tests.md)                     | suggestion | Disallow `setInterval` usage in test files                                                          |
| [no-fetch-in-tests](no-fetch-in-tests.md)                                   | suggestion | Disallow `fetch` usage in test files                                                                |
| [no-restricted-imports-in-tests](no-restricted-imports-in-tests.md)         | suggestion | Disallow configured dependency imports in test files                                                |
| [no-test-interface-declaration](no-test-interface-declaration.md)           | suggestion | Disallow interface declarations in test files; import production types instead                      |
| [no-unawaited-async-assertion](no-unawaited-async-assertion.md)             | problem    | Require asynchronous test assertions to be awaited or returned                                      |
| [no-vitest-imprecise-spy-assertions](no-vitest-imprecise-spy-assertions.md) | suggestion | Require exact Vitest spy call counts and invocation indices                                         |

## Type Safety

| Rule                                                                                | Type       | Description                                                                        |
| ----------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| [no-type-assertion](no-type-assertion.md)                                           | suggestion | Prevent use of TypeScript `as` and angle-bracket assertions                        |
| [no-non-null-assertion](no-non-null-assertion.md)                                   | problem    | Disallow non-null assertions using the `!` postfix operator                        |
| [no-explicit-any](no-explicit-any.md)                                               | problem    | Disallow explicit `any`; require precise modeling or explicit narrowing            |
| [no-indexed-access-types](no-indexed-access-types.md)                               | problem    | Disallow TypeScript indexed access types                                           |
| [no-literal-unions](no-literal-unions.md)                                           | suggestion | Report literal unions for manual migration to enums                                |
| [no-literal-property-unions](no-literal-property-unions.md)                         | suggestion | Require property literal unions to use named domain types                          |
| [no-inline-type-import](no-inline-type-import.md)                                   | problem    | Disallow inline `import("...")` type annotations                                   |
| [no-return-type](no-return-type.md)                                                 | problem    | Disallow TypeScript `ReturnType` utility usage                                     |
| [require-union-type-alias](require-union-type-alias.md)                             | suggestion | Require inline union types with multiple type references to use named type aliases |
| [no-destructured-parameter-type-literal](no-destructured-parameter-type-literal.md) | suggestion | Disallow inline object type literals on destructured parameters                    |
| [require-exported-object-type](require-exported-object-type.md)                     | suggestion | Require exported object constants to declare an explicit type annotation           |
| [no-unsafe-json-parse](no-unsafe-json-parse.md)                                     | problem    | Disallow treating JSON.parse results as typed data without validation              |

## Code Quality

| Rule                                                              | Type       | Description                                                                            |
| ----------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| [max-function-lines](max-function-lines.md)                       | suggestion | Limit block and expression function bodies with optional blank/comment exclusions      |
| [max-params](max-params.md)                                       | suggestion | Enforce a maximum number of function parameters                                        |
| [no-array-mutation](no-array-mutation.md)                         | suggestion | Disallow mutating methods on known arrays and tuples                                   |
| [no-date-now](no-date-now.md)                                     | suggestion | Disallow `Date.now()` and no-arg `new Date()` usage                                    |
| [no-placeholder-implementation](no-placeholder-implementation.md) | problem    | Disallow placeholder, stub, TODO, and not implemented production code                  |
| [no-magic-numbers](no-magic-numbers.md)                           | suggestion | Disallow magic numbers; use named constants instead                                    |
| [no-magic-strings](no-magic-strings.md)                           | suggestion | Disallow magic strings in comparisons and switch cases                                 |
| [no-map-set-mutation](no-map-set-mutation.md)                     | suggestion | Disallow direct `Map` and `Set` mutation methods                                       |
| [no-object-mutation](no-object-mutation.md)                       | suggestion | Disallow direct object-property mutation                                               |
| [sort-imports](sort-imports.md)                                   | suggestion | Report import ordering while preserving runtime dependency order                       |
| [sort-functions](sort-functions.md)                               | suggestion | Require top-level functions and const function expressions to be sorted alphabetically |
| [prefer-nullish-coalescing](prefer-nullish-coalescing.md)         | suggestion | Prefer nullish coalescing for locally bound identifier guard ternaries                 |
| [prefer-object-spread](prefer-object-spread.md)                   | suggestion | Report empty-target Object.assign calls for manual review                              |
| [prefer-readonly-parameters](prefer-readonly-parameters.md)       | suggestion | Prefer readonly typing for object and array-like parameters                            |
| [prefer-string-raw](prefer-string-raw.md)                         | suggestion | Prefer native `String.raw` when the constructor is not shadowed                        |
| [prefer-structured-clone](prefer-structured-clone.md)             | suggestion | Review JSON cloning before considering structuredClone                                 |

## Error Handling

| Rule                                            | Type       | Description                                                                          |
| ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| [no-empty-catch](no-empty-catch.md)             | problem    | Disallow empty catch blocks that silently swallow errors                             |
| [require-error-cause](require-error-cause.md)   | problem    | Preserve caught exceptions when throwing replacement errors (opt-in)                 |
| [no-throw-literal](no-throw-literal.md)         | problem    | Disallow throwing literals, objects, or templates; always throw a new Error instance |
| [prefer-result-return](prefer-result-return.md) | suggestion | Prefer returning Result-style values instead of throwing                             |

## Imports

| Rule                                                                  | Type       | Description                                                                     |
| --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| [require-clean-barrel](require-clean-barrel.md)                       | suggestion | Require barrel files (index.\*) to contain only module re-exports               |
| [require-barrel-relative-exports](require-barrel-relative-exports.md) | suggestion | Require barrel re-exports to use `./` descendant paths                          |
| [no-dynamic-import](no-dynamic-import.md)                             | problem    | Ban dynamic `import()` and `require()` outside test files                       |
| [no-export-alias](no-export-alias.md)                                 | suggestion | Prevent use of aliases in export statements                                     |
| [no-hardcoded-secrets](no-hardcoded-secrets.md)                       | problem    | Disallow hardcoded secrets, credentials, tokens, and secret env defaults        |
| [no-raw-sql-interpolation](no-raw-sql-interpolation.md)               | problem    | Disallow interpolated raw SQL and unsafe raw query helpers                      |
| [no-barrel-parent-imports](no-barrel-parent-imports.md)               | suggestion | Disallow parent-directory traversal in barrel-file import paths                 |
| [no-parent-internal-access](no-parent-internal-access.md)             | suggestion | Disallow parent-relative access into protected internal directories such as src |
| [no-re-export](no-re-export.md)                                       | suggestion | Disallow direct or pass-through re-exports from parent/grandparent modules      |
| [no-shell-command-construction](no-shell-command-construction.md)     | problem    | Disallow shell command construction through subprocess APIs                     |
| [no-unsafe-code-generation](no-unsafe-code-generation.md)             | problem    | Disallow eval, Function constructors, string timers, and vm execution APIs      |
| [require-node-protocol](require-node-protocol.md)                     | suggestion | Require Node.js built-in module imports to use the `node:` protocol prefix      |

## Bug Prevention

| Rule                                                              | Type       | Description                                                                      |
| ----------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| [no-identical-expressions](no-identical-expressions.md)           | problem    | Report repeated stable operands in comparisons and logical expressions           |
| [no-identical-branches](no-identical-branches.md)                 | suggestion | Disallow identical conditional branches                                          |
| [no-boolean-return-trap](no-boolean-return-trap.md)               | suggestion | Disallow ambiguous boolean-return APIs outside predicate naming                  |
| [no-redundant-boolean](no-redundant-boolean.md)                   | suggestion | Simplify comparisons only when the operand is known to be boolean                |
| [no-for-in](no-for-in.md)                                         | problem    | Disallow for..in loops without rewriting inherited-key behavior                  |
| [no-labels](no-labels.md)                                         | problem    | Disallow labeled statements                                                      |
| [no-with](no-with.md)                                             | problem    | Disallow `with` statements                                                       |
| [no-await-in-loop](no-await-in-loop.md)                           | problem    | Review await inside loops with configurable sequential-work exceptions           |
| [no-floating-promises](no-floating-promises.md)                   | problem    | Check explicit, local async, and type-resolved promises                          |
| [no-math-random](no-math-random.md)                               | problem    | Disallow `Math.random()`; inject a random source instead                         |
| [no-eslint-disable](no-eslint-disable.md)                         | suggestion | Prevent use of `eslint-disable` comments                                         |
| [no-ts-nocheck](no-ts-nocheck.md)                                 | problem    | Prevent use of `@ts-nocheck` comments                                            |
| [no-parameter-reassign](no-parameter-reassign.md)                 | suggestion | Disallow reassigning function parameters                                         |
| [no-process-env-outside-config](no-process-env-outside-config.md) | problem    | Disallow `process.env` reads outside configuration modules                       |
| [no-flag-argument](no-flag-argument.md)                           | suggestion | Disallow boolean flag parameters in function signatures                          |
| [prefer-guard-clauses](prefer-guard-clauses.md)                   | suggestion | Prefer guard clauses by removing else blocks after terminating if branches       |
| [prefer-shortcut-return](prefer-shortcut-return.md)               | suggestion | Simplify boolean returns while retaining comments                                |
| [no-query-side-effects](no-query-side-effects.md)                 | suggestion | Disallow observable mutation in query functions while allowing local computation |
| [require-timeout-for-io](require-timeout-for-io.md)               | problem    | Require API-specific timeout or cancellation options for external IO calls       |
| [require-exhaustive-switch](require-exhaustive-switch.md)         | suggestion | Require exhaustive `switch` statements over finite discriminant types            |

## Choose checks

Each rule page explains what is reported, how to configure the check, and where its analysis stops. Enable [require-error-cause](../rules/require-error-cause.md) individually to preserve original exceptions.

For promise handling, unsafe types, callback returns, and branching limits, see [additional code-quality checks](../configuration.md#additional-code-quality-checks-individual-opt-in).
