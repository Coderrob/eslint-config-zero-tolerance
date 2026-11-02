# Rule fix safety gap analysis

The fixtures for the rules below cover both a pattern the rule should handle and a valid input whose behavior a rewrite could change. The negative cases assert that ESLint leaves the source unchanged.

| Rule                        | Positive fixture                                             | Negative fixture                                                              | Safety decision                                                             |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `no-for-in`                 | Reports ordinary `for..in`; allows `for..of`                 | Inherited enumerable key is visited by `for..in` but omitted by `Object.keys` | Report without autofix                                                      |
| `no-redundant-boolean`      | Simplifies syntactically boolean comparisons and ternaries   | Numeric operands, arithmetic precedence, and comments can change or disappear | Preserve boolean results and parenthesize fixes; skip commented expressions |
| `prefer-nullish-coalescing` | Fixes a nullish guard around a locally bound identifier      | Getters, unbound identifiers, logical or conditional fallbacks, and comments  | Skip unstable reads and comments; parenthesize fallback expressions         |
| `prefer-object-spread`      | Reports empty-target `Object.assign`; allows explicit spread | An inline getter or `__proto__` source can change copy behavior               | Opt-in, report without autofix                                              |
| `prefer-structured-clone`   | Reports direct JSON cloning; allows ordinary parsing         | JSON drops `undefined` properties and serializes `Date` values                | Opt-in, report without autofix                                              |
| `require-optional-chaining` | Reports repeated guards; allows existing optional chains     | `text && text.length` and `text?.length` differ for an empty string           | Opt-in, report without autofix                                              |

The opt-in rules remain available for manual review. The negative fixtures are assertions about diagnostics or autofix output, and the rule pages describe the runtime differences behind them.

| Rule                     | Positive contract                             | Negative or state contract                                                         | Safety decision                                 |
| ------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| `no-literal-unions`      | Reports literal unions                        | Existing string assignments and callers must still compile                         | Report without autofix; migrate uses manually   |
| `sort-imports`           | Sorts explicit type imports                   | Named and default imports may initialize shared state                              | Preserve runtime dependency order               |
| `prefer-string-raw`      | Fixes eligible literals using native String   | Shadowed parameters and later bindings must retain literal values                  | Resolve scope for each literal                  |
| `no-floating-promises`   | Reports local async and typed promise results | Shadowed functions, async generators, missing handlers, and later chain rejections | Resolve lexical bindings and terminal callbacks |
| `prefer-shortcut-return` | Simplifies opposite boolean returns           | Comments in branches or between statements must survive                            | Skip commented replacement spans                |

## Improvement checklist

- [x] Preserve the existing work and integrate current main, including the parser and lexical-binding regressions.
- [x] Correct the five remaining rule defects and retain the six original safety improvements.
- [x] Test positive and negative inputs, parameter boundaries, shadowed and overwritten bindings, and state isolation between files.
- [x] Compare runtime values and fallback/getter counts across falsy, truthy, and nullish parameters; retain TypeScript assignability.
- [x] Use one release preparation workflow and one publication workflow, retaining candidate checks, tag ancestry, provenance, and package previews.
- [x] Check invalid release sizes, version bounds, dates, package eligibility, and unchanged files after invalid requests.
- [x] Complete all repository validation gates and review the final diff.
- [ ] Push the verified branch and open a new PR.

Verification: 2,588 plugin tests, 4 config tests, and 28 script tests pass. Plugin coverage is 99.69% statements and 98.41% branches; every required file meets the 95% gate. Both workspace type checks, the full lint/build/metadata/package gate, and actionlint pass.
