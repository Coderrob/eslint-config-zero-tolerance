# Contributing

Thank you for contributing to `eslint-plugin-zero-tolerance`! This guide walks you through the environment setup, the process for adding a new rule, and the release workflow.

## Prerequisites

| Tool    | Version                                |
| ------- | -------------------------------------- |
| Node.js | 20+                                    |
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

## Building

```bash
# Build all packages (plugin + config)
pnpm build

# Build a single package
pnpm --filter eslint-plugin-zero-tolerance build
```

## Running Tests

```bash
# Run all tests across the workspace
pnpm test

# Run tests for the plugin only (in watch mode during development)
pnpm --filter eslint-plugin-zero-tolerance test -- --watch
```

## Coding Standards

This repository dogfoods its own rules. All source code in `packages/` must pass:

```bash
pnpm build && pnpm lint
```

Key conventions enforced by the plugin and documented in [`AGENTS.md`](AGENTS.md):

- Interface names must start with `I` (`require-interface-prefix`)
- All non-test functions must have a JSDoc comment (`require-jsdoc-functions`)
- Import declarations must be sorted alphabetically (`sort-imports`)
- No parent-relative imports (`no-relative-parent-imports`)
- No `eslint-disable` comments — fix the underlying issue (`no-eslint-disable`)

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

See the [Release Process](AGENTS.md#release-process) section of `AGENTS.md` for the full versioned release workflow.
