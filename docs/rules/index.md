# Rules

`@coderrob/eslint-plugin-zero-tolerance` provides a suite of **custom rules** grouped into seven categories.

## Naming Conventions

| Rule                                                    | Type       | Description                                 |
| ------------------------------------------------------- | ---------- | ------------------------------------------- |
| [require-interface-prefix](require-interface-prefix.md) | suggestion | Enforce that interface names start with `I` |

## Documentation

| Rule                                                                | Type       | Description                                                 |
| ------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| [require-jsdoc-functions](require-jsdoc-functions.md)               | suggestion | Require JSDoc comments on all functions (except test files) |
| [require-optional-chaining](require-optional-chaining.md)           | suggestion | Require optional chaining instead of repeated guard access  |
| [require-zod-schema-description](require-zod-schema-description.md) | suggestion | Enforce that Zod schemas have `.describe()` called          |

## Testing

| Rule                                                                | Type       | Description                                                                                                   |
| ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| [require-test-description-style](require-test-description-style.md) | suggestion | Enforce that test descriptions start with `should`                                                            |
| [no-jest-have-been-called](no-jest-have-been-called.md)             | suggestion | Prohibit imprecise call-assertion matchers; use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead |
| [no-mock-implementation](no-mock-implementation.md)                 | suggestion | Prohibit persistent mock methods; use `Once` variants to prevent test bleeds                                  |

## Type Safety

| Rule                                              | Type       | Description                                                 |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| [no-type-assertion](no-type-assertion.md)         | suggestion | Prevent use of TypeScript `as` type assertions              |
| [no-non-null-assertion](no-non-null-assertion.md) | problem    | Disallow non-null assertions using the `!` postfix operator |
| [no-literal-unions](no-literal-unions.md)         | suggestion | Ban literal union types in favour of enums                  |
| [no-banned-types](no-banned-types.md)             | problem    | Ban `ReturnType` and indexed access types                   |

## Code Quality

| Rule                                        | Type       | Description                                                                             |
| ------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| [max-function-lines](max-function-lines.md) | suggestion | Enforce a maximum number of lines per function body                                     |
| [max-params](max-params.md)                 | suggestion | Enforce a maximum number of function parameters                                         |
| [no-magic-numbers](no-magic-numbers.md)     | suggestion | Disallow magic numbers; use named constants instead                                     |
| [no-magic-strings](no-magic-strings.md)     | suggestion | Disallow magic strings in comparisons and switch cases                                  |
| [sort-imports](sort-imports.md)             | suggestion | Require import declarations to be ordered by group and alphabetically within each group |
| [sort-functions](sort-functions.md)         | suggestion | Require top-level functions and const function expressions to be sorted alphabetically  |

## Error Handling

| Rule                                    | Type    | Description                                                                          |
| --------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| [no-empty-catch](no-empty-catch.md)     | problem | Disallow empty catch blocks that silently swallow errors                             |
| [no-throw-literal](no-throw-literal.md) | problem | Disallow throwing literals, objects, or templates; always throw a new Error instance |

## Imports

| Rule                                      | Type       | Description                                                   |
| ----------------------------------------- | ---------- | ------------------------------------------------------------- |
| [no-dynamic-import](no-dynamic-import.md) | problem    | Ban `await import()` and `require()` outside test files       |
| [no-export-alias](no-export-alias.md)     | suggestion | Prevent use of aliases in export statements                   |
| [no-re-export](no-re-export.md)           | suggestion | Disallow re-export statements from parent/grandparent modules |

## Bug Prevention

| Rule                                                    | Type       | Description                                                                  |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| [no-identical-expressions](no-identical-expressions.md) | problem    | Disallow identical expressions on both sides of a binary or logical operator |
| [no-redundant-boolean](no-redundant-boolean.md)         | suggestion | Disallow redundant comparisons to boolean literals                           |
| [no-await-in-loop](no-await-in-loop.md)                 | problem    | Disallow `await` inside loops; use `Promise.all()` instead                   |
| [no-eslint-disable](no-eslint-disable.md)               | suggestion | Prevent use of `eslint-disable` comments                                     |
