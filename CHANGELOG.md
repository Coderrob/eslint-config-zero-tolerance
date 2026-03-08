# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- No unreleased changes yet.

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
