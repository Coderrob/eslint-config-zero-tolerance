# Contributing

Thank you for contributing to `@coderrob/eslint-plugin-zero-tolerance`! This guide walks you through the environment setup, the process for adding a new rule, and the release workflow.

## Prerequisites

| Tool    | Version                                |
| ------- | -------------------------------------- |
| Node.js | 20.20.2, 22.23.1, or 24.18.0 (LTS)     |
| pnpm    | 10+                                    |
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

This repository dogfoods its own rules. All source code in `packages/` must pass:

```bash
pnpm build && pnpm lint
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

Only `@coderrob/eslint-plugin-zero-tolerance` is published. The config workspace is internal.

1. Run **Prepare Release** (`prepare-release.yml`) from the Actions tab on `main`. Choose `revision` (patch), `minor`, or `major`. The workflow bumps `packages/plugin/package.json`, moves Unreleased notes into a dated changelog section, runs all release checks, and opens a `release/vX.Y.Z` PR.
2. Review and merge the release PR. Create and push tag `vX.Y.Z` on the merged commit. The tag must match the plugin manifest and dated changelog entry.
3. Pushing the tag starts **Publish To npm** (`publish-npm.yml`). It can also be run using `workflow_dispatch` on `main`, supplying that existing tag. It verifies that the tagged commit belongs to `main`, reruns validation, previews the package, and publishes only `packages/plugin`.

Configure an npm trusted publisher for owner `Coderrob`, repository `eslint-config-zero-tolerance`, and workflow filename `publish-npm.yml`, allowing direct `npm publish`. The workflow uses OIDC and provenance on a GitHub-hosted runner; it needs no npm token. See [npm's trusted publishing setup](https://docs.npmjs.com/trusted-publishers/).

Enable **Allow GitHub Actions to create and approve pull requests** in the repository's Actions settings. By default, release PRs use `GITHUB_TOKEN`; GitHub may require a maintainer to select **Approve workflows to run** on the PR before its CI runs. To trigger that CI automatically, add a `RELEASE_PR_TOKEN` secret with repository contents and pull-request write permissions. The preparation workflow always validates the candidate itself. See [GitHub's workflow triggering rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

These workflows prepare release files and perform publication only when run on GitHub. Adding them does not publish a release or change the current version. See [AGENTS.md](AGENTS.md#release-process) for manual release instructions.
