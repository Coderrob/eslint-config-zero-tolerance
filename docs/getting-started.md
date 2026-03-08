# Getting Started

This guide shows how to add `@coderrob/eslint-plugin-zero-tolerance` to a TypeScript project from scratch.

## Requirements

| Dependency                  | Version      |
| --------------------------- | ------------ |
| Node.js                     | 18+          |
| TypeScript                  | 5.x          |
| ESLint                      | 8.57+ or 9.x |
| `@typescript-eslint/parser` | 8.x          |

## Installation

=== "npm"

    ```bash
    npm install --save-dev @coderrob/eslint-plugin-zero-tolerance @typescript-eslint/parser
    ```

=== "pnpm"

    ```bash
    pnpm add -D @coderrob/eslint-plugin-zero-tolerance @typescript-eslint/parser
    ```

=== "yarn"

    ```bash
    yarn add -D @coderrob/eslint-plugin-zero-tolerance @typescript-eslint/parser
    ```

## ESLint 9+ (Flat Config)

### Recommended preset

The recommended preset enables all rules at **warn** severity, making it easy to adopt incrementally.

```js title="eslint.config.js"
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.recommended,
  // your other configs...
];
```

### Strict preset

The strict preset enables all rules at **error** severity and applies tighter limits (e.g. max function body: 15 lines).

```js title="eslint.config.js"
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [zeroTolerance.configs.strict];
```

### Custom configuration

Pick individual rules and set severities yourself:

```js title="eslint.config.js"
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  {
    plugins: {
      'zero-tolerance': zeroTolerance,
    },
    rules: {
      'zero-tolerance/require-interface-prefix': 'error',
      'zero-tolerance/no-throw-literal': 'error',
      'zero-tolerance/max-function-lines': ['warn', { max: 40 }],
      'zero-tolerance/max-params': ['warn', { max: 5 }],
      // ... add any rules you need
    },
  },
];
```

### Using the separate config package

If you prefer to import pre-built config presets as separate modules:

```bash
npm install --save-dev @coderrob/eslint-config-zero-tolerance
```

```js title="eslint.config.js"
import recommended from '@coderrob/eslint-config-zero-tolerance/recommended';
// or
import strict from '@coderrob/eslint-config-zero-tolerance/strict';

export default [
  recommended, // or strict
];
```

## ESLint 8.x (Legacy `.eslintrc`)

```js title=".eslintrc.js"
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['zero-tolerance'],
  extends: ['plugin:zero-tolerance/legacy-recommended'],
  // or for strict mode:
  // extends: ['plugin:zero-tolerance/legacy-strict'],
};
```

## Typical TypeScript Project Setup

A complete `eslint.config.js` for a TypeScript project:

```js title="eslint.config.js"
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  zeroTolerance.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Override individual rules as needed
      'zero-tolerance/max-function-lines': ['warn', { max: 50 }],
    },
  },
  {
    // Relax rules in test files
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'zero-tolerance/require-jsdoc-functions': 'off',
      'zero-tolerance/no-type-assertion': 'off',
    },
  },
);
```

## Configuring `tsconfig.json`

No TypeScript-specific configuration is required by this plugin. All rules operate purely on the AST without requiring type information.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["src"]
}
```

## Next Steps

- Browse the [Rules](rules/index.md) reference for descriptions, examples, and severity settings for every rule.
- Read the [Configuration](configuration.md) page to understand the difference between the recommended and strict presets.
