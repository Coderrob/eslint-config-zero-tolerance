# Rules

`@coderrob/eslint-plugin-zero-tolerance` provides a suite of **custom rules** grouped into eight categories.

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
| [require-optional-chaining](require-optional-chaining.md)                 | suggestion | Require optional chaining instead of repeated guard access                                              |
| [require-readonly-props](require-readonly-props.md)                       | suggestion | Require JSX component props to be typed as readonly                                                     |

## Testing

| Rule                                                                | Type       | Description                                                                                                   |
| ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| [require-test-description-style](require-test-description-style.md) | suggestion | Enforce that test descriptions start with `should`                                                            |
| [no-jest-have-been-called](no-jest-have-been-called.md)             | suggestion | Prohibit imprecise call-assertion matchers; use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead |
| [no-mock-implementation](no-mock-implementation.md)                 | suggestion | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds                                  |

## Type Safety

| Rule                                                                                | Type       | Description                                                              |
| ----------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| [no-type-assertion](no-type-assertion.md)                                           | suggestion | Prevent use of TypeScript `as` and angle-bracket assertions              |
| [no-non-null-assertion](no-non-null-assertion.md)                                   | problem    | Disallow non-null assertions using the `!` postfix operator              |
| [no-literal-unions](no-literal-unions.md)                                           | suggestion | Ban literal union types in favour of enums                               |
| [no-banned-types](no-banned-types.md)                                               | problem    | Ban `ReturnType` and indexed access types                                |
| [no-inline-type-import](no-inline-type-import.md)                                   | problem    | Disallow inline `import("...")` type annotations                         |
| [no-destructured-parameter-type-literal](no-destructured-parameter-type-literal.md) | suggestion | Disallow inline object type literals on destructured parameters          |
| [require-exported-object-type](require-exported-object-type.md)                     | suggestion | Require exported object constants to declare an explicit type annotation |

## Code Quality

| Rule                                                        | Type       | Description                                                                             |
| ----------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| [max-function-lines](max-function-lines.md)                 | suggestion | Enforce a maximum number of lines per function body                                     |
| [max-params](max-params.md)                                 | suggestion | Enforce a maximum number of function parameters                                         |
| [no-array-mutation](no-array-mutation.md)                   | suggestion | Disallow mutating array methods                                                         |
| [no-date-now](no-date-now.md)                               | suggestion | Disallow `Date.now()` and no-arg `new Date()` usage                                     |
| [no-magic-numbers](no-magic-numbers.md)                     | suggestion | Disallow magic numbers; use named constants instead                                     |
| [no-magic-strings](no-magic-strings.md)                     | suggestion | Disallow magic strings in comparisons and switch cases                                  |
| [no-object-mutation](no-object-mutation.md)                 | suggestion | Disallow direct object-property mutation                                                |
| [sort-imports](sort-imports.md)                             | suggestion | Require import declarations to be ordered by group and alphabetically within each group |
| [sort-functions](sort-functions.md)                         | suggestion | Require top-level functions and const function expressions to be sorted alphabetically  |
| [prefer-nullish-coalescing](prefer-nullish-coalescing.md)   | suggestion | Prefer nullish coalescing instead of repeated nullish guard ternaries                   |
| [prefer-readonly-parameters](prefer-readonly-parameters.md) | suggestion | Prefer readonly typing for object and array-like parameters                             |
| [prefer-string-raw](prefer-string-raw.md)                   | suggestion | Prefer `String.raw` for strings containing escaped backslashes                          |

## Error Handling

| Rule                                            | Type       | Description                                                                          |
| ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| [no-empty-catch](no-empty-catch.md)             | problem    | Disallow empty catch blocks that silently swallow errors                             |
| [no-throw-literal](no-throw-literal.md)         | problem    | Disallow throwing literals, objects, or templates; always throw a new Error instance |
| [prefer-result-return](prefer-result-return.md) | suggestion | Prefer returning Result-style values instead of throwing                             |

## Imports

| Rule                                                      | Type       | Description                                                                     |
| --------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| [require-clean-barrel](require-clean-barrel.md)           | suggestion | Require barrel files (index.\*) to contain only module re-exports               |
| [no-dynamic-import](no-dynamic-import.md)                 | problem    | Ban dynamic `import()` and `require()` outside test files                       |
| [no-export-alias](no-export-alias.md)                     | suggestion | Prevent use of aliases in export statements                                     |
| [no-barrel-parent-imports](no-barrel-parent-imports.md)   | suggestion | Disallow parent-directory traversal in barrel-file import paths                 |
| [no-parent-internal-access](no-parent-internal-access.md) | suggestion | Disallow parent-relative access into protected internal directories such as src |
| [no-re-export](no-re-export.md)                           | suggestion | Disallow direct or pass-through re-exports from parent/grandparent modules      |

## Bug Prevention

| Rule                                                    | Type       | Description                                                                  |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| [no-identical-expressions](no-identical-expressions.md) | problem    | Disallow identical expressions on both sides of a binary or logical operator |
| [no-identical-branches](no-identical-branches.md)       | suggestion | Disallow identical conditional branches                                      |
| [no-boolean-return-trap](no-boolean-return-trap.md)     | suggestion | Disallow ambiguous boolean-return APIs outside predicate naming              |
| [no-redundant-boolean](no-redundant-boolean.md)         | suggestion | Disallow redundant comparisons to boolean literals                           |
| [no-for-in](no-for-in.md)                               | problem    | Disallow `for..in` loops                                                     |
| [no-labels](no-labels.md)                               | problem    | Disallow labeled statements                                                  |
| [no-with](no-with.md)                                   | problem    | Disallow `with` statements                                                   |
| [no-await-in-loop](no-await-in-loop.md)                 | problem    | Disallow `await` inside loops; use `Promise.all()` instead                   |
| [no-floating-promises](no-floating-promises.md)         | problem    | Disallow unhandled promise expressions; require explicit handling            |
| [no-eslint-disable](no-eslint-disable.md)               | suggestion | Prevent use of `eslint-disable` comments                                     |
| [no-parameter-reassign](no-parameter-reassign.md)       | suggestion | Disallow reassigning function parameters                                     |
| [no-flag-argument](no-flag-argument.md)                 | suggestion | Disallow boolean flag parameters in function signatures                      |
| [prefer-guard-clauses](prefer-guard-clauses.md)         | suggestion | Prefer guard clauses by removing else blocks after terminating if branches   |
| [prefer-shortcut-return](prefer-shortcut-return.md)     | suggestion | Prefer shortcut boolean returns over if branches that return true/false      |
| [no-query-side-effects](no-query-side-effects.md)       | suggestion | Disallow side effects in query-style functions                               |
