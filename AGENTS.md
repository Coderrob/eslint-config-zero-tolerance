# AGENTS.md

## Overview

This repository is a monorepo containing an ESLint plugin (`eslint-plugin-zero-tolerance`) and a config package (`eslint-config-zero-tolerance`). It is published to NPM and enforces zero-tolerance coding standards via custom ESLint rules.

---

## Repository Structure

```
eslint-config-zero-tolerance/
├── packages/
│   ├── plugin/          # eslint-plugin-zero-tolerance
│   │   └── src/
│   │       ├── index.ts          # Plugin entry point; registers all rules and config presets
│   │       └── rules/
│   │           ├── <rule-name>.ts        # Rule implementation
│   │           └── <rule-name>.test.ts   # Rule unit tests
│   └── config/          # eslint-config-zero-tolerance
│       └── src/
│           ├── index.ts          # Re-exports all config presets
│           ├── recommended.ts    # Recommended config (warn severity)
│           └── strict.ts         # Strict config (error severity)
├── scripts/             # Release and workspace utility scripts
├── AGENTS.md            # This file
├── CHANGELOG.md         # Audit trail of all changes
├── README.md            # Public-facing documentation
└── package.json         # Workspace root
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
  - Exported rule constants: `camelCase` matching the rule name (e.g., `noExportAlias`)
  - Config files: `kebab-case` descriptive name (e.g., `recommended.ts`, `strict.ts`)

### TypeScript

- Use `strict` TypeScript (`"strict": true` in `tsconfig.json`).
- Prefer explicit types over inferred ones on public function signatures.
- Never use `any` except where required by ESLint's internal APIs (e.g., rule tester casts, plugin registration).
- Use `ESLintUtils.RuleCreator` from `@typescript-eslint/utils` for all custom rules.

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
3. **Export**: Named export of the rule constant plus a default export.
4. **Registration**: Import and register in `packages/plugin/src/index.ts` under both `rules` and all config presets (`recommendedConfig`, `strictConfig`, `legacyRecommendedConfig`, `legacyStrictConfig`).
5. **Config sync**: Add the rule to `packages/config/src/index.ts`, `recommended.ts`, and `strict.ts`.

### Rule Template

```typescript
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

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

## Mock and Test Guidelines

- **Never use** `mockImplementation`, `mockReturnValue`, `mockResolvedValue`, or `mockRejectedValue` in tests. Use their `Once` variants to prevent state from leaking between tests.
- **Never use** `toHaveBeenCalled` or `toHaveBeenCalledWith`. Use `toHaveBeenCalledTimes` and `toHaveBeenNthCalledWith` for precise assertions.
- Test descriptions must start with `"should"`.

---

## Release Process

1. Implement the rule and its tests in `packages/plugin/src/rules/`.
2. Register the rule in `packages/plugin/src/index.ts` and all config presets.
3. Sync the rule to `packages/config/src/`.
4. Add an entry to `CHANGELOG.md` under `[Unreleased]`.
5. Run `pnpm test` and confirm all tests pass.
6. Run `pnpm build` to validate the TypeScript compilation.
7. On release, update `CHANGELOG.md` with the version number and date, then publish via `pnpm prepare-publish`.
