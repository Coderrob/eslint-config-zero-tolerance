# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **`no-export-alias` rule**: Prevents the use of aliases in export statements (e.g., `export { foo as bar }`). Ensures exports use their original names directly to maintain clear and consistent module interfaces.

- **`no-jest-have-been-called` rule**: Prohibits the use of `toHaveBeenCalled` and `toHaveBeenCalledWith` in test assertions. Enforces use of `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` instead, which require explicit call-count and argument expectations.

- **`no-mock-implementation` rule**: Prohibits persistent mock setup methods (`mockImplementation`, `mockReturnValue`, `mockResolvedValue`, `mockRejectedValue`) that leak state between tests. Enforces use of their `Once` variants (`mockImplementationOnce`, `mockReturnValueOnce`, `mockResolvedValueOnce`, `mockRejectedValueOnce`) to prevent test bleeds.

- **`require-jsdoc-functions` rule**: Requires JSDoc documentation comments on all function declarations, function expressions, and arrow functions outside of test files (`.test.*` / `.spec.*`). Promotes self-documenting code and supports NPM publication with comprehensive API documentation.

- **`AGENTS.md`**: Added structural and coding style guidelines for contributors and AI agents. Documents folder organisation, naming conventions, rule authoring guidelines, mock/test standards, and the release process.

- **`CHANGELOG.md`**: Added this file as an audit trail of changes pending and past releases, following the Keep a Changelog format.

### Changed

- **`eslint-plugin-zero-tolerance` index** (`packages/plugin/src/index.ts`): Registered the four new rules (`no-export-alias`, `no-jest-have-been-called`, `no-mock-implementation`, `require-jsdoc-functions`) in the `rules` map and in all four config presets (`recommended`, `strict`, `legacy-recommended`, `legacy-strict`).

- **`eslint-config-zero-tolerance` configs** (`packages/config/src/index.ts`, `recommended.ts`, `strict.ts`): Synced all four new rules into both the recommended (warn) and strict (error) config presets.
