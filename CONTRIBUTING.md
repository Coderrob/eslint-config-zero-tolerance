# Contributing

Thank you for contributing to `@coderrob/eslint-plugin-zero-tolerance`! This guide walks you through the environment setup, the process for adding a new rule, and the release workflow.

## Prerequisites

| Tool    | Version                                |
| ------- | -------------------------------------- |
| Node.js | 24.22.2 or 26.13.0 (LTS)               |
| pnpm    | 12.16.1                                |
| Python  | 3.x (only if working on the docs site) |

## Setup

```bash
# Clone the repository
git clone https://github.com/Coderrob/eslint-config-zero-tolerance.git
cd eslint-config-zero-tolerance

# Install all workspace dependencies
pnpm install
```

Use `pnpm install` for the workspace root. `npm install` is supported for consumers installing the published plugin into their own projects, but not for bootstrapping this monorepo.

The workspace uses pnpm 12.16.1 and runs its full build, lint, and test suite on Node 24 and 26. Older Node releases are covered by separate packed-package consumer checks. Build permissions and dependency overrides are configured in `pnpm-workspace.yaml`.

TypeScript remains on 5.9.3, the newest release satisfying all current peer requirements: `madge` requires TypeScript 5, and `@typescript-eslint/parser` does not support TypeScript 7. Upgrade the compiler when the dependency graph supports it without peer overrides.

## Building

```bash
# Build all packages (plugin + config)
pnpm build

# Build a single package
pnpm --filter @coderrob/eslint-plugin-zero-tolerance build
```

## Running Tests

```bash
# Run all tests across the workspace
pnpm test

# Run tests for the plugin only (in watch mode during development)
pnpm --filter @coderrob/eslint-plugin-zero-tolerance test -- --watch

# Run a single plugin test file with focused coverage
pnpm --filter @coderrob/eslint-plugin-zero-tolerance test -- sort-imports.test.ts
```

## Coding Standards

This repository applies its plugin to TypeScript source and repository scripts. The seven updated rules, including opt-in `require-error-cause`, are enabled explicitly in `eslint.config.mjs`. TypeScript source keeps a 15-line function limit; scripts use the 30-line default. Test-specific exceptions remain in place. See the [dogfooding overview](README.md#dogfooding).

Run the repository checks with:

```bash
pnpm lint
```

Key conventions enforced by the plugin and documented in [`AGENTS.md`](AGENTS.md):

- Interface names must start with `I` (`require-interface-prefix`)
- Named non-test functions must have a JSDoc comment (`require-jsdoc-functions`)
- Anonymous non-test function-like constructs must have a JSDoc comment (`require-jsdoc-anonymous-functions`)
- Barrel files (`index.*`) must contain only module re-export declarations (`require-clean-barrel`)
- Barrel re-export declarations must target descendant-relative `./` paths (`require-barrel-relative-exports`)
- Import declarations must be ordered by group (side-effect -> builtin -> external -> parent -> peer -> index) and alphabetically within each group (`sort-imports`)
- No parent-relative re-exports (`no-re-export`)
- No `eslint-disable` comments — fix the underlying issue (`no-eslint-disable`)

Repository rule layout is validated automatically by `pnpm validate:rules`. It verifies the supported kebab-case filename, sibling unit test, and source-to-built-plugin registry parity. Generic rule correctness is enforced by `eslint-plugin-eslint-plugin`, BDD siblings by `pnpm validate:bdd`, documentation by `eslint-doc-generator`, and preset behavior by unit tests.

README synchronization is also automated with `eslint-doc-generator`. `pnpm readme:sync` regenerates the root `README.md` rule catalog from the built plugin and repository category metadata, while `pnpm validate:readme` fails if the generated output would differ from the checked-in README.

Dead code and abandoned dependencies are checked with Knip. Run `pnpm validate:dead-code`; the command fails for unused files, exports, dependencies, or stale Knip configuration hints.

## Adding a New Rule

Follow these steps in order. Each step has a concrete example using a hypothetical `no-foo` rule.

### 1. Create the rule file

```
packages/plugin/src/rules/no-foo.ts
```

Use the template below. The rule creator URL must stay in sync with the GitHub repo URL.

```typescript
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`,
);

/**
 * Prevents use of foo() which is banned because it does X.
 */
export const noFoo = createRule({
  name: 'no-foo',
  meta: {
    type: 'problem', // 'problem' | 'suggestion' | 'layout'
    docs: {
      description: 'Disallow use of foo()',
      recommended: 'recommended',
    },
    messages: {
      noFoo: 'foo() is not allowed; use bar() instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'foo') {
          context.report({ node, messageId: 'noFoo' });
        }
      },
    };
  },
});

export default noFoo;
```

### 2. Create the test file

```
packages/plugin/src/rules/no-foo.test.ts
```

```typescript
import { RuleTester } from '@typescript-eslint/rule-tester';
import noFoo from './no-foo';

const ruleTester = new RuleTester();

ruleTester.run('no-foo', noFoo, {
  valid: [{ name: 'should allow bar()', code: 'bar();' }],
  invalid: [
    {
      name: 'should disallow foo()',
      code: 'foo();',
      errors: [{ messageId: 'noFoo' }],
    },
  ],
});
```

Test requirements:

- All test names must start with `should`
- Provide both `valid` and `invalid` cases
- Cover all code paths (target ≥ 95% coverage)

### 3. Register the rule in the plugin

In `packages/plugin/src/index.ts`, add the import and register the rule in all four presets:

```typescript
import noFoo from './rules/no-foo';

const rules = {
  // ...existing rules
  'no-foo': noFoo,
};

// Add to recommendedConfig, strictConfig, legacyRecommendedConfig, legacyStrictConfig:
'zero-tolerance/no-foo': 'warn',  // recommended
'zero-tolerance/no-foo': 'error', // strict
```

### 4. Sync to the config package

In `packages/config/src/recommended.ts` and `packages/config/src/strict.ts`, add the rule at the appropriate severity. In `packages/config/src/index.ts` add it to both the flat and legacy exports.

### 5. Add a documentation page

Create `docs/rules/no-foo.md` following the structure of an existing rule page (rationale, ✅ correct examples, ❌ incorrect examples, options table, config snippet).

Register the page in the `nav` section of `mkdocs.yml` under the appropriate category.

### 6. Update the changelog

Add an entry under `## [Unreleased]` in `CHANGELOG.md`:

```markdown
- **`no-foo` rule**: Short description of what it enforces and why.
```

### 7. Verify

```bash
pnpm validate:readme  # root README must match generated rule metadata
pnpm validate:dead-code # Knip must find no unused files, exports, or dependencies
pnpm validate:rules  # rule filenames, test siblings, and built registration must stay aligned
pnpm test     # all tests must pass
pnpm build    # TypeScript must compile cleanly
```

## Docs Site (MkDocs)

To preview the documentation site locally:

```bash
pip install mkdocs-material
mkdocs serve
```

The site will be available at `http://localhost:8000`. The `--strict` flag is used in CI to treat warnings as errors:

```bash
mkdocs build --strict
```

## Pull Request Guidelines

- One logical change per PR (one new rule, one bug fix, one refactor)
- All tests must pass
- The TypeScript build must succeed
- The changelog must be updated under `[Unreleased]`
- The docs must include a rule page if a new rule is added

## Release Process

Run the **Prepare plugin release** workflow on `main` with a `major`, `minor`, or `revision` bump. Review its PR, including every change since the previous tag in `CHANGELOG.md`, and merge after CI passes. Tag the merge commit as `v<plugin-version>` and publish a non-prerelease GitHub Release to start npm publication. Configure the repository Actions secret `NPM_TOKEN` with npm publish access. To retry publication, manually run **Publish plugin to npm** from `main` with the published release tag; see the [publishing instructions](README.md#publishing) for the full setup.

## Publishing

Only `@coderrob/eslint-plugin-zero-tolerance` is published. To prepare a release, run the **Prepare plugin release** GitHub Actions workflow on `main` and choose `major`, `minor`, or `revision` (`revision` means a patch bump). The workflow opens a release PR that updates `packages/plugin/package.json`, moves the current `[Unreleased]` changelog entries into a dated version section, and creates a fresh `[Unreleased]` section. It also starts CI for the release branch. Enable **Allow GitHub Actions to create and approve pull requests** in repository Actions settings, then review the changelog and merge the PR after CI passes.

After merging, create a tag named `v<plugin-version>` on the merge commit and publish a non-prerelease GitHub Release for that tag. The **Publish plugin to npm** workflow checks that the tag is on `main`, matches the plugin manifest, and has a dated changelog section; then it validates and publishes the plugin with provenance. Add a granular npm access token with direct publishing access as the repository Actions secret `NPM_TOKEN` before publishing.

To retry a failed npm publication, run **Publish plugin to npm** manually from `main` and enter the existing published GitHub Release tag as `release_tag`. The workflow repeats the release checks and uses the same `NPM_TOKEN` secret. npm rejects a retry if that package version has already been published.

The equivalent local checks are:

```bash
pnpm lint
pnpm test
pnpm build
```

The internal config workspace package is not published.
