# Rule fix safety gap analysis

The fixtures for these six rules cover both a pattern the rule should handle and a valid input whose behavior a rewrite could change. The negative cases assert that ESLint leaves the source unchanged.

| Rule                        | Positive fixture                                             | Negative fixture                                                              | Safety decision                                                             |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `no-for-in`                 | Reports ordinary `for..in`; allows `for..of`                 | Inherited enumerable key is visited by `for..in` but omitted by `Object.keys` | Report without autofix                                                      |
| `no-redundant-boolean`      | Simplifies syntactically boolean comparisons and ternaries   | Numeric operands, arithmetic precedence, and comments can change or disappear | Preserve boolean results and parenthesize fixes; skip commented expressions |
| `prefer-nullish-coalescing` | Fixes a nullish guard around a locally bound identifier      | Getters, unbound identifiers, logical or conditional fallbacks, and comments  | Skip unstable reads and comments; parenthesize fallback expressions         |
| `prefer-object-spread`      | Reports empty-target `Object.assign`; allows explicit spread | An inline getter or `__proto__` source can change copy behavior               | Opt-in, report without autofix                                              |
| `prefer-structured-clone`   | Reports direct JSON cloning; allows ordinary parsing         | JSON drops `undefined` properties and serializes `Date` values                | Opt-in, report without autofix                                              |
| `require-optional-chaining` | Reports repeated guards; allows existing optional chains     | `text && text.length` and `text?.length` differ for an empty string           | Opt-in, report without autofix                                              |

The opt-in rules remain available for manual review. The negative fixtures are assertions about diagnostics or autofix output, and the rule pages describe the runtime differences behind them.
