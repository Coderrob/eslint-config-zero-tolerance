# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **`no-export-alias` rule**: Prevents the use of aliases in export statements (e.g., `export { foo as bar }`). Ensures exports use their original names directly to maintain clear and consistent module interfaces.

- **`no-re-export` rule**: Disallows re-export statements that target modules outside the current directory (for example, `export { foo } from '../module'` and `export * from '../module'`). Re-exports from the same directory (`./*`) are allowed. Barrel files may only re-export modules; they may not declare or otherwise define functionality within them.

- **`no-jest-have-been-called` rule**: Prohibits the use of `toHaveBeenCalled` and `toHaveBeenCalledWith` in test assertions. Enforces use of `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead, which require explicit call-count and argument expectations.

- **`no-mock-implementation` rule**: Prohibits persistent mock setup methods (`mockImplementation`, `mockReturnValue`, `mockResolvedValue`, `mockRejectedValue`) that leak state between tests. Enforces use of their `Once` variants (`mockImplementationOnce`, `mockReturnValueOnce`, `mockResolvedValueOnce`, `mockRejectedValueOnce`) to prevent test bleeds.

- **`require-jsdoc-functions` rule**: Requires JSDoc documentation comments on all function declarations, function expressions, and arrow functions outside of test files (`.test.*` / `.spec.*`). Promotes self-documenting code and supports NPM publication with comprehensive API documentation.

- **`no-type-assertion` rule**: Prevents use of TypeScript `as` type assertions in production code. Allows `as unknown` inside test files where it is a necessary pattern for rule testers.

- **`no-eslint-disable` rule**: Prevents use of `eslint-disable` comments. Enforces fixing violations at source rather than suppressing them.

- **`sort-imports` rule**: Requires import declarations to be sorted alphabetically by module path (case-insensitive). Eliminates merge conflicts on import blocks.

- **`sort-functions` rule**: Requires top-level `function` declarations to be sorted alphabetically. Makes a module's exported API predictable to navigate.

- **`no-magic-numbers` rule**: Disallows raw numeric literals in expressions. Allows `0`, `1`, `-1` (universally understood sentinels) and literals used as `const` initializers or enum member values.

- **`no-magic-strings` rule**: Disallows string literals used directly in `===`/`!==` comparisons and `switch`-case clauses. Requires extracting them into named constants.

- **`max-function-lines` rule**: Enforces a maximum line count on function bodies. Default is 30 lines in the recommended preset and 20 lines in the strict preset. Accepts a `{ max: number }` option.

- **`max-params` rule**: Enforces a maximum number of function parameters. Default is 4 in both presets. Accepts a `{ max: number }` option.

- **`no-identical-expressions` rule**: Disallows identical expressions on both sides of a binary or logical operator (Sonar S1764). Flags `===`, `!==`, `==`, `!=`, `&&`, `||`, `??`, `+`, `-`, `/`, `%` when both operands are textually identical.

- **`no-redundant-boolean` rule**: Disallows redundant comparisons to boolean literals (Sonar S1125). Flags `=== true`, `!== true`, `=== false`, `!== false`.

- **`no-empty-catch` rule**: Disallows empty catch blocks that silently swallow errors. Every catch clause must contain at least one statement.

- **`no-non-null-assertion` rule**: Disallows non-null assertions using the `!` postfix operator. Requires optional chaining or explicit null checks instead.

- **`no-await-in-loop` rule**: Disallows `await` expressions directly inside loop bodies. Requires refactoring to `Promise.all()` or `Promise.allSettled()` for parallel execution.

- **`no-throw-literal` rule**: Disallows throwing literals, plain objects, numbers, or template strings. Only `NewExpression`, `Identifier` (re-throw), `MemberExpression`, `CallExpression`, and `AwaitExpression` are accepted as throw arguments.

- **`docs/`**: MkDocs documentation site (Material theme) covering Getting Started, Configuration, and one dedicated page per rule. Published to GitHub Pages via GitHub Actions.

- **`CONTRIBUTING.md`**: Step-by-step contributor guide covering environment setup, adding a rule, running tests, and the release process.

- **`.github/workflows/ci.yml`**: CI workflow that installs dependencies, builds, and runs the full test suite on every push to `main` and on every pull request.

- **`.github/workflows/docs.yml`**: Workflow that publishes the MkDocs site to GitHub Pages on every push to `main`.

- **`packages/plugin/.npmignore`** and **`packages/config/.npmignore`**: Exclude source files, test infrastructure, and TypeScript configs from published npm tarballs.

- **`AGENTS.md`**: Added structural and coding style guidelines for contributors and AI agents. Documents folder organisation, naming conventions, rule authoring guidelines, mock/test standards, and the release process.

- **`CHANGELOG.md`**: Added this file as an audit trail of changes pending and past releases, following the Keep a Changelog format.

### Changed

- **`eslint.config.mjs`**: Fixed stale rule names (`interface-prefix` → `require-interface-prefix`, `test-description-style` → `require-test-description-style`, `zod-schema-description` → `require-zod-schema-description`) and expanded dogfooding to include all 25 plugin rules.

- **`eslint-plugin-zero-tolerance` index** (`packages/plugin/src/index.ts`): Registered all new rules in the `rules` map and in all four config presets (`recommended`, `strict`, `legacy-recommended`, `legacy-strict`).

- **`eslint-config-zero-tolerance` configs** (`packages/config/src/index.ts`, `recommended.ts`, `strict.ts`): Synced all new rules into both the recommended (warn) and strict (error) config presets.
