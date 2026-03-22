# AGENTS.md

## Overview

This repository is a monorepo containing an ESLint plugin (`@coderrob/eslint-plugin-zero-tolerance`) and a config package (`@coderrob/eslint-config-zero-tolerance`). It is published to NPM and enforces zero-tolerance coding standards via custom ESLint rules.

---

## Repository Structure

```text
eslint-config-zero-tolerance/
├── .github/
│   └── workflows/
│       ├── ci.yml        # CI: install, build, test on every PR and push to main
│       └── docs.yml      # Publishes MkDocs site to GitHub Pages on push to main
├── docs/                 # MkDocs source pages
│   ├── index.md          # Site home page
│   ├── getting-started.md
│   ├── configuration.md
│   └── rules/            # One .md per rule plus overview index
├── packages/
│   ├── plugin/           # @coderrob/eslint-plugin-zero-tolerance
│   │   └── src/
│   │       ├── index.ts          # Plugin entry point; registers all rules and config presets
│   │       └── rules/
│   │           ├── <rule-name>.ts            # Rule implementation
│   │           ├── <rule-name>.test.ts       # Rule unit tests
│   │           └── <rule-name>.ts.bdd.json  # BDD specification metadata
│   └── config/           # eslint-config-zero-tolerance
│       └── src/
│           ├── index.ts          # Re-exports all config presets
│           ├── recommended.ts    # Recommended config (warn severity)
│           └── strict.ts         # Strict config (error severity)
├── scripts/              # Release and workspace utility scripts
├── bdd-spec.schema.json  # JSON Schema for BDD specification files
├── AGENTS.md             # This file
├── CHANGELOG.md          # Audit trail of all changes
├── CONTRIBUTING.md       # Contributor guide
├── mkdocs.yml            # MkDocs site configuration (Material theme)
├── README.md             # Public-facing documentation
└── package.json          # Workspace root
```

---

## Coding Style

### General Principles

- **Small functions**: Every function must be focused on a single responsibility and kept as short as reasonably possible.
- **Small, immutable files**: Each file exports one concept (one rule, one config). Avoid large files that combine multiple concerns.
- **Self-describing names**: File names, function names, and variable names must clearly communicate intent without requiring additional comments.
- **Cohesive folder organisation**: Group related files together. Rule implementations and their tests live side-by-side in `src/rules/`.
- **Consistent naming conventions**:
  - Rule files: `kebab-case` (e.g., `no-export-alias.ts`)
  - Rule test files: `kebab-case` with `.test.ts` suffix (e.g., `no-export-alias.test.ts`)
  - BDD spec files: source file name with `.bdd.json` appended (e.g., `no-export-alias.ts.bdd.json`)
  - Exported rule constants: `camelCase` matching the rule name (e.g., `noExportAlias`)
  - Config files: `kebab-case` descriptive name (e.g., `recommended.ts`, `strict.ts`)

### TypeScript

- Use `strict` TypeScript (`"strict": true` in `tsconfig.json`).
- Prefer explicit types over inferred ones on public function signatures.
- Never use `any` except where required by ESLint's internal APIs (e.g., rule tester casts, plugin registration).
- Use the shared `createRule` helper from `packages/plugin/src/rule-factory.ts` for all custom rules.

### JSDoc

- All exported functions and rule implementations must have a JSDoc comment describing their purpose.
- Test files are exempt from the JSDoc requirement.

### Imports

- Use absolute imports (no `../` parent-directory traversal).
- Do not use export aliases (`export { foo as bar }`); export values directly.

---

## Rule Authoring Guidelines

Each new ESLint rule must follow this structure:

1. **File**: `packages/plugin/src/rules/<rule-name>.ts`
2. **Test file**: `packages/plugin/src/rules/<rule-name>.test.ts`
3. **BDD spec file**: `packages/plugin/src/rules/<rule-name>.ts.bdd.json` — must be created alongside the rule and kept in sync with any behavioural changes. See [BDD Specification Guidelines](#bdd-specification-guidelines).
4. **Export**: Named export of the rule constant plus a default export.
5. **Registration**: Import and register in `packages/plugin/src/index.ts` under `rules` and ensure it is included by the exported presets (`recommended`, `strict`, `legacy-recommended`, `legacy-strict`).
6. **Config sync note**: `packages/config` re-exports plugin configs; no manual rule sync is required there.

### Required Rule Change Checks

These checks are mandatory whenever a rule is **added**, **updated**, or **removed**:

1. Keep documentation in sync:
   - Update the rule page in `docs/rules/` (or remove it if the rule is removed).
   - Update rule indexes/tables in `docs/rules/index.md`, `docs/index.md`, `README.md`, and `packages/plugin/README.md`.
   - Update `mkdocs.yml` navigation entries when rule pages are added/removed/renamed.
2. Keep the BDD spec file in sync:
   - Update `packages/plugin/src/rules/<rule-name>.ts.bdd.json` to reflect any new, changed, or removed behaviours.
   - Add new scenarios for any new code paths or edge cases introduced.
   - Remove scenarios for any behaviours that are deleted.
   - The `module.exports` array must match the current named exports of the rule file.
3. Update `CHANGELOG.md` under `[Unreleased]` with the rule change details.

4. Run required validations and ensure they all pass: `pnpm validate:bdd`, `pnpm lint`, `pnpm test`, `pnpm --filter @coderrob/eslint-plugin-zero-tolerance exec tsc -p tsconfig.json --noEmit`, `pnpm --filter @coderrob/eslint-config-zero-tolerance exec tsc -p tsconfig.json --noEmit`, and `pnpm build`.

### Rule Template

```typescript
import { createRule } from '../rule-factory';

export const myRuleName = createRule({
  name: 'my-rule-name',
  meta: {
    type: 'suggestion', // or 'problem' or 'layout'
    docs: {
      description: 'Short description of what the rule enforces',
      recommended: 'recommended',
    },
    messages: {
      myMessageId: 'Human-readable error message with {{placeholder}} support',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      // AST visitor methods
    };
  },
});

export default myRuleName;
```

### Test Requirements

- Use `@typescript-eslint/rule-tester`'s `RuleTester`.
- Provide both `valid` and `invalid` test cases.
- Name each test case descriptively.
- Cover at least **95% of the rule's code paths**.
- Include edge cases (e.g., negated matchers, chained calls, generic types).

---

## BDD Specification Guidelines

Every non-test `.ts` source file under `packages/plugin/src/` must have a sibling `.ts.bdd.json` file that describes its behaviour in BDD (Given/When/Then) format. These files conform to the `bdd-spec.schema.json` schema at the workspace root.

### Required fields

| Field            | Description                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `$schema`        | Relative path to `bdd-spec.schema.json` from the spec file's location                                   |
| `schemaVersion`  | Must be `"1.0.0"`                                                                                       |
| `sourceFile`     | Workspace-relative path to the `.ts` source file (e.g., `packages/plugin/src/rules/no-export-alias.ts`) |
| `module`         | Object with `name`, `description`, and `exports` array                                                  |
| `specifications` | Array of feature objects, each with a `feature` name and `scenarios` array                              |

### `$schema` relative path depth

- Files in `src/` → `../../../bdd-spec.schema.json`
- Files in `src/configs/` or `src/rules/` → `../../../../bdd-spec.schema.json`

### Scenario structure

Each scenario must have:

- `name` — starts with `"should"`, describes the expected outcome
- `given` — precondition or context
- `when` — the action or trigger
- `then` — the observable result

### When to update BDD spec files

- **Adding a rule**: Create a new `.ts.bdd.json` for the rule file, covering all valid and invalid code paths as separate scenarios.
- **Changing rule behaviour**: Update the relevant scenarios in the existing `.ts.bdd.json`; add new scenarios for new code paths; remove scenarios for deleted behaviours.
- **Removing a rule**: Delete the corresponding `.ts.bdd.json`.
- **Changing any non-test utility file** (`ast-guards.ts`, `rule-factory.ts`, etc.): Update the sibling `.ts.bdd.json` to reflect the changed exports or behaviours.

BDD spec files are **not** compiled or executed — they are living documentation. Keeping them accurate is part of the Definition of Done.

---

## Mock and Test Guidelines

- **Never use** `mockImplementation`, `mockReturnValue`, `mockResolvedValue`, or `mockRejectedValue` in tests. Use their `Once` variants to prevent state from leaking between tests.
- **Never use** `toHaveBeenCalled` or `toHaveBeenCalledWith`. Use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` for precise assertions.
- Test descriptions must start with `"should"`.

---

## Release Process

1. Implement the rule and its tests in `packages/plugin/src/rules/`.
2. Register the rule in `packages/plugin/src/index.ts` and all config presets.
3. Add a doc page in `docs/rules/<rule-name>.md` and register it in `mkdocs.yml`.
4. Add an entry to `CHANGELOG.md` under `[Unreleased]`.
5. Run `pnpm test` and confirm all tests pass.
6. Run `pnpm build` to validate the TypeScript compilation.
7. On release, update `CHANGELOG.md` with the version number and date, then publish via `pnpm release:prepare`.

---

## Definition of Done

Before considering any rule or behavior change complete:

1. Run `pnpm validate:bdd` and ensure it passes.
2. Run `pnpm lint` and ensure it passes.
3. Run `pnpm test` (or the relevant workspace test command) and ensure it passes.
4. Run type checks for plugin and config packages and ensure they pass.
5. Run `pnpm build` and ensure it passes.
6. Update `CHANGELOG.md` under `[Unreleased]`.
7. Update documentation (`docs/`, root/package READMEs, and `mkdocs.yml` navigation when needed) so rule lists, configuration tables, and rule pages stay in sync.
8. Update the sibling `.ts.bdd.json` for every modified `.ts` source file so that BDD scenarios accurately reflect the current behaviour.
