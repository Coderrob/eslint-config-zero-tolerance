# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed

- **Coverage cleanup**: Simplified unreachable defensive branches in `prefer-readonly-parameters`, `no-magic-strings`, and `no-literal-unions` so the rules keep the same behavior while their remaining conditional paths are fully exercised by tests.
- **Helper structure**: Grouped shared AST, JSDoc, import-path, type-guard, rule-support, and test-helper modules into dedicated `helpers/`, `rules/support/`, and `testing/` folders to make reuse points easier to locate and maintain.
- **Rule helper reuse**: Extracted shared function-node listener builders into `rules/support/function-listeners.ts`, added shared `getCallMemberMethodName` and parameter-binding helpers, completed a dedicated `helpers/ast/` layer with navigation, calls, parameters, types, search, and statements modules, and rewired rule-local AST interpretation onto those shared helpers while also replacing duplicated function-name resolution in `require-jsdoc-functions` and `require-readonly-props` with the existing shared AST helpers.
- **Call-shape reuse**: Added a shared `getMatchingCallMemberMethodName` helper in `helpers/ast/calls.ts` and rewired `no-array-mutation` and `no-query-side-effects` to use it instead of keeping duplicate member-call filtering logic.
- **AST guard reuse**: Added shared `isNamedIdentifierNode` and `isUncomputedMemberExpressionNode` guards in `helpers/ast-guards.ts` and rewired multiple rules to reuse those exact-name and direct-member checks instead of keeping local ad hoc predicates.
- **Type helper reuse**: Expanded `helpers/ast/types.ts` with shared first-type-argument and named-generic-reference helpers, then rewired `no-boolean-return-trap` and `require-readonly-props` to consume that shared type-reference evaluation instead of combining those checks locally.
- **Literal helper reuse**: Added shared string-literal extraction in `helpers/ast-helpers.ts`, reused it in `helpers/ast/calls.ts`, and removed duplicate literal-string parsing from `no-parent-imports` and `no-magic-strings`.

## [1.2.1] - 2026-04-01

### Added

- **`no-destructured-parameter-type-literal` rule**: Disallows object-destructured parameters from declaring inline object type literals such as `{ set }: Readonly<{ set: UiStateSetter }>` and requires those parameter contracts to flow through a named type instead.
- **`require-clean-barrel` rule**: Enforces that barrel files (`index.*`) remain aggregation-only by allowing only module re-export declarations and reporting imports, local declarations, default exports, and local export lists without a `from` source.
- **`require-jsdoc-anonymous-functions` rule**: Split anonymous-function JSDoc enforcement from `require-jsdoc-functions` into a dedicated rule so teams can configure anonymous and named function documentation requirements independently.

### Changed

- **`require-jsdoc-anonymous-functions` rule**: Excludes anonymous callbacks passed to well-known test APIs and lifecycle hooks such as `describe`, `it`, `test`, `beforeEach`, and `afterAll`, including chained forms like `describe.only(...)` and `test.skip.each(...)`.
- **Test infrastructure**: Extracted a shared `test-helper.ts` module that exports a pre-configured `RuleTester` instance. Standard rule test files now import `ruleTester` from `../test-helper`, and `tsconfig.json` excludes `test-helper.ts` from production type-checking so devDependency imports do not affect builds.
- **`rule-map.ts` simplifications**: Removed the `buildRuleMap` wrapper function by inlining `Object.fromEntries(ruleEntries)` at the `ruleMap` export and simplified `getPresetRuleConfig` to a single ternary expression.
- **`ast-guards.ts` `isTestFile` helper**: Replaced the guard-clause early return with a single boolean expression for simpler path matching.
- **`require-jsdoc-functions` rule**: Now enforces JSDoc and tag coverage only for named function-like constructs; anonymous function-like constructs are handled by `require-jsdoc-anonymous-functions`.
- **Preset defaults**: Set `require-jsdoc-anonymous-functions` to `off` in `recommended` and `warn` in `strict`, set `prefer-result-return` to `off` in `recommended` and `warn` in `strict`, raised `max-function-lines` to `warn` with `max: 30` in `recommended` and `error` with `max: 25` in `strict`, and restored `no-parent-imports` to the built-in preset defaults including the legacy variants.
- **Documentation sync**: Updated preset and rule docs to reflect the new preset defaults, including `no-parent-imports` being enabled by default again while `require-bdd-spec` remains opt-in.

### Fixed

- **`require-jsdoc-functions` rule**: Made AST traversal resilient when `sourceCode.visitorKeys` does not define a node type, preventing runtime errors while scanning function bodies for `return` and `throw` statements.
- **`require-bdd-spec` rule**: Tightened plain-object validation so only records with `Object.prototype` or a null prototype are narrowed as `Record<string, unknown>`, excluding arrays, `Date`, `Map`, and class instances.

## [1.2.0] - 2026-03-26

### Changed

- **ESLint version support**: Updated peer dependencies to support ESLint 8.57.0+, 9.x, and 10.x (previously 8.57.0+ and 9.x only).
- **TypeScript-ESLint version**: Updated `@typescript-eslint/*` packages to version 8.57.2 for compatibility with ESLint 10.
- **Dependency maintenance**: Updated indirect `picomatch` versions in `packages/plugin/package-lock.json` as part of the tagged `v1.2.0` release commit.

## [1.1.8] - 2026-03-24

### Fixed

- **`sort-functions` rule**: Fixed autofix comment ownership so attached leading JSDoc blocks move with reordered declarations, including exported `const` function declarations.

### Changed

- **`sort-functions` rule**: Reworked owned leading-comment collection to use an iterative scan instead of recursive array spreading, avoiding repeated allocations when many attached comments precede a declaration.

## [1.1.7] - 2026-03-22

### Fixed

- **`no-object-mutation` rule**: Stopped reporting constructor field initialization assignments on `this`, so common class setup like `this.name = ...` and `this.context = ...` no longer triggers false positives.

### Changed

- **`require-jsdoc-functions` rule**: Clarified and regression-tested that JSDoc enforcement applies to all function-like constructs in non-test files, including `static` class methods.
- **`prefer-readonly-parameters` rule**: Added autofix support for safe readonly-typing rewrites, including constructor parameter properties with mutable type references, arrays, and tuples.
- **`require-bdd-spec` rule**: Removed it from the built-in preset defaults so it is now opt-in in both `recommended` and `strict`.
- **`sort-functions` rule**: Upgraded autofix to move owned leading comments and same-line trailing comments with sorted declarations, while still skipping directive or ambiguous interstitial comments.

## [1.1.6] - 2026-03-22

### Added

- **`require-bdd-spec` rule**: Enforce that every non-test TypeScript source file has a valid sibling `.ts.bdd.json` BDD specification file. The rule validates required fields, value types, schema version, non-empty specifications and scenarios, scenario names starting with `"should"`, and exact export parity between `module.exports` and the actual named exports of the source file. All errors are aggregated into a single report per file.

## [1.1.5] - 2026-03-11

### Added

- **`require-readonly-props` rule**: Enforces readonly typing for JSX component props. Component props must be declared as `Readonly<Props>` or as an inline type literal with `readonly` members.
- **`prefer-readonly-parameters` rule**: Prefers readonly typing for object and array-like function parameters to reduce accidental input mutation.
- **`no-array-mutation` rule**: Disallows mutating array methods such as `push`, `splice`, `sort`, `reverse`, and related in-place operations.
- **`no-object-mutation` rule**: Disallows direct object-property mutation via assignment, update operators, and `delete`.
- **`prefer-result-return` rule**: Prefers returning Result-style values over throwing in non-test code to keep error flows explicit.
- **`no-date-now` rule**: Disallows `Date.now()` and no-argument `new Date()` usage to encourage injected clocks and deterministic tests.
- **`no-boolean-return-trap` rule**: Disallows ambiguous boolean-return APIs unless they follow predicate naming conventions (`is*`, `has*`, `can*`, `should*`).

## [1.1.4] - 2026-03-11

### Fixed

- **`require-jsdoc-functions`**: Fixed JSDoc ownership for exported variable functions so comments placed above `export const ... = () => {}` are recognized, and missing-JSDoc autofix now inserts above the export declaration.

## [1.1.3] - 2026-03-09

### Added

- **Standalone syntax rules**: Added `no-for-in`, `no-labels`, and `no-with` as first-class plugin rules to ban prototype-chain `for..in` loops, labeled statements, and `with` statements.

### Changed

- **Preset enforcement architecture**: Replaced temporary preset-level `no-restricted-syntax` wiring with dedicated plugin rules so syntax restrictions remain discoverable, testable, and versioned as standalone rules.
- **`no-for-in` rule**: Added autofix support to rewrite `for..in` loops into `for..of Object.keys(...)` loops.

## [1.1.2] - 2026-03-09

### Added

- **`no-inline-type-import` rule**: Disallows TypeScript inline type import queries like `import("module").Type`. This blocks patterns such as inline `import("typescript").Program` in exported types and interfaces, requiring top-level `import type` declarations instead.
- **`prefer-string-raw` rule**: Flags string literals containing escaped backslashes and recommends `String.raw` to avoid manual backslash escaping (Sonar `typescript:S7780`).

### Changed

- **`require-jsdoc-functions` rule**: Expanded enforcement to require `@param` tags when functions have parameters, `@returns` (or `@return`) when functions return values, and `@throws` when functions throw.
- **`no-literal-unions` rule**: Added a limited autofix for pure string-literal union type aliases, converting them into enums with generated member names.
- **Autofix expansion**:
  - `prefer-string-raw` now auto-rewrites eligible escaped-backslash string literals to `String.raw` tagged templates.
  - `require-test-description-style` now auto-prefixes non-compliant string test descriptions.
  - `require-jsdoc-functions` now auto-inserts missing JSDoc blocks and appends missing `@param`, `@returns`, and `@throws` tags for safe targets.
- **Single-test coverage stability**: Updated plugin Jest coverage behavior to focus `collectCoverageFrom` on explicitly targeted test files (including special handling for `plugin-wiring.test.ts`), and expanded `ast-guards` tests to keep single-file coverage above thresholds.
- **Documentation updates**: Added `prefer-string-raw` rule docs and navigation entries; updated configuration and `no-literal-unions` docs to reflect current behavior.

## [1.1.1] - 2026-03-08

### Changed

- **Preset policy update**: `no-parent-imports` is now opt-in and no longer enabled by default in `recommended`, `strict`, `legacy-recommended`, or `legacy-strict`. Parent imports are allowed by default; parent re-export restrictions remain enforced via `no-re-export`.
- **Documentation sync**: Updated preset and rule docs to reflect that `no-parent-imports` remains available but is not enabled by default.

## [1.1.0] - 2026-03-08

### Added

- **`no-export-alias` rule**: Prevents the use of aliases in export statements (e.g., `export { foo as bar }`). Ensures exports use their original names directly to maintain clear and consistent module interfaces.
- **`no-re-export` rule**: Disallows re-export statements that target modules outside the current directory (for example, `export { foo } from '../module'` and `export * from '../module'`). Re-exports from the same directory (`./*`) are allowed. Barrel files may only re-export modules; they may not declare or otherwise define functionality within them.
- **`no-parent-imports` rule**: Disallows parent-directory traversal in all import patterns (`import ... from`, `import()`, `require()`, and TypeScript `import = require`) by banning `..` and `../*` paths. Enforces absolute/project-rooted import boundaries for all non-export imports.
- **`no-jest-have-been-called` rule**: Prohibits the use of `toHaveBeenCalled` and `toHaveBeenCalledWith` in test assertions. Enforces use of `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead, which require explicit call-count and argument expectations.
- **`no-mock-implementation` rule**: Prohibits persistent mock setup methods (`mockImplementation`, `mockReturnValue`, `mockResolvedValue`, `mockRejectedValue`) that leak state between tests. Enforces use of their `Once` variants (`mockImplementationOnce`, `mockReturnValueOnce`, `mockResolvedValueOnce`, `mockRejectedValueOnce`) to prevent test bleeds.
- **`require-jsdoc-functions` rule**: Requires JSDoc documentation comments on all function declarations, function expressions, and arrow functions outside of test files (`.test.*` / `.spec.*`). Promotes self-documenting code and supports NPM publication with comprehensive API documentation.
- **`no-type-assertion` rule**: Prevents use of TypeScript `as` type assertions in production code. Allows `as unknown` inside test files where it is a necessary pattern for rule testers.
- **`no-eslint-disable` rule**: Prevents use of `eslint-disable` comments. Enforces fixing violations at source rather than suppressing them.
- **`sort-imports` rule**: Requires import declarations to be sorted alphabetically by module path (case-insensitive). Eliminates merge conflicts on import blocks.
- **`sort-functions` rule**: Requires top-level `function` declarations to be sorted alphabetically. Makes a module's exported API predictable to navigate.
- **`no-magic-numbers` rule**: Disallows raw numeric literals in expressions. Allows `0`, `1`, `-1` (universally understood sentinels) and literals used as `const` initializers or enum member values.
- **`no-magic-strings` rule**: Disallows string literals used directly in `===`/`!==` comparisons and `switch`-case clauses. Requires extracting them into named constants.
- **`max-function-lines` rule**: Enforces a maximum line count on function bodies. Default is 20 lines in the recommended preset and 15 lines in the strict preset. Accepts a `{ max: number }` option.
- **`max-params` rule**: Enforces a maximum number of function parameters. Default is 4 in both presets. Accepts a `{ max: number }` option.
- **`no-identical-expressions` rule**: Disallows identical expressions on both sides of a binary or logical operator (Sonar S1764). Flags `===`, `!==`, `==`, `!=`, `&&`, `||`, `??`, `+`, `-`, `/`, `%` when both operands are textually identical.
- **`no-redundant-boolean` rule**: Disallows redundant comparisons to boolean literals (Sonar S1125). Flags `=== true`, `!== true`, `=== false`, `!== false`.
- **`no-empty-catch` rule**: Disallows empty catch blocks that silently swallow errors. Every catch clause must contain at least one statement.
- **`no-non-null-assertion` rule**: Disallows non-null assertions using the `!` postfix operator. Requires optional chaining or explicit null checks instead.
- **`no-await-in-loop` rule**: Disallows `await` expressions directly inside loop bodies. Requires refactoring to `Promise.all()` or `Promise.allSettled()` for parallel execution.
- **`no-floating-promises` rule**: Disallows unhandled promise expressions. Requires explicit handling with `await`, `void`, `.catch(...)`, or `then(..., onRejected)` for recognized promise-producing patterns.
- **`no-throw-literal` rule**: Disallows throwing literals, plain objects, numbers, or template strings. By default only `throw new ...` and direct catch-parameter rethrows are accepted, with options to allow call/member/await throw expressions.
- **`docs/`**: MkDocs documentation site (Material theme) covering Getting Started, Configuration, and one dedicated page per rule. Published to GitHub Pages via GitHub Actions.
- **`CONTRIBUTING.md`**: Step-by-step contributor guide covering environment setup, adding a rule, running tests, and the release process.
- **`.github/workflows/ci.yml`**: CI workflow that installs dependencies, builds, and runs the full test suite on every push to `main` and on every pull request.
- **`.github/workflows/docs.yml`**: Workflow that publishes the MkDocs site to GitHub Pages on every push to `main`.
- **`packages/plugin/.npmignore`** and **`packages/config/.npmignore`**: Exclude source files, test infrastructure, and TypeScript configs from published npm tarballs.
- **`AGENTS.md`**: Added structural and coding style guidelines for contributors and AI agents. Documents folder organisation, naming conventions, rule authoring guidelines, mock/test standards, and the release process.
- **`CHANGELOG.md`**: Added this file as an audit trail of changes pending and past releases, following the Keep a Changelog format.

### Changed

- **`eslint.config.mjs`**: Fixed stale rule names (`interface-prefix` -> `require-interface-prefix`, `test-description-style` -> `require-test-description-style`, `zod-schema-description` -> `require-zod-schema-description`) and expanded dogfooding to include all plugin rules.
- **`@coderrob/eslint-plugin-zero-tolerance` index** (`packages/plugin/src/index.ts`): Registered all new rules in the `rules` map and in all four config presets (`recommended`, `strict`, `legacy-recommended`, `legacy-strict`).
- **`eslint-config-zero-tolerance` configs** (`packages/config/src/index.ts`, `recommended.ts`, `strict.ts`): Synced all new rules into both the recommended (warn) and strict (error) config presets.
- **Removed `require-zod-schema-description`**: The rule and its tests were removed from the plugin. Rule registration, preset wiring, and documentation/navigation references were updated accordingly.
- **`no-type-assertion`**: Expanded enforcement to include angle-bracket assertions (`<Type>value`) in addition to `as` assertions.
- **`no-dynamic-import`**: Expanded enforcement to all dynamic `import()` expressions (including non-`await` usage such as `import('x').then(...)`) outside recognized test files.
- **Test file matching**: Expanded `isTestFile` detection to include `__tests__/` paths plus `.e2e.*` and `.integration.*` suffixes.
- **`no-throw-literal`**: Tightened defaults to require `throw new ...` or direct catch-parameter rethrows, with options to allow call/member/await throw expressions for compatibility.
- **Configurability improvements**: Added options to `no-magic-strings` (`checkComparisons`, `checkSwitchCases`, `ignoreValues`) and `require-test-description-style` (`prefix`, `ignoreSkip`), and updated documentation.
- **`no-parameter-reassign` rule**: Added a new rule to disallow reassignment of function parameters, encouraging Split Variable / Extract Variable refactorings.
- **`no-flag-argument` rule**: Added a new rule to disallow boolean flag parameters, encouraging explicit methods or parameter objects.
- **`no-identical-branches` rule**: Added a new rule to disallow identical `if/else` and ternary branches, encouraging consolidation and simpler control flow.
- **`prefer-guard-clauses` rule**: Added a new rule to prefer guard clauses over `else` blocks when the `if` branch already returns/throws.
- **`prefer-shortcut-return` rule**: Added a new autofixable rule to replace boolean-return `if` patterns (`if (cond) return true; return false;` and inverse forms) with shortcut return expressions.
- **`no-query-side-effects` rule**: Added a new rule to disallow side effects in query-style functions (`get*`, `is*`, `has*`, `can*`, `should*`) to enforce separation of query and modifier concerns.
