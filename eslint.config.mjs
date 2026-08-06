// @ts-check

/**
 * ESLint configuration for the zero-tolerance monorepo.
 *
 * This configuration enforces strict coding standards across TypeScript and JavaScript files,
 * including dogfooding the zero-tolerance ESLint plugin rules.
 */

import eslint from '@eslint/js';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zeroTolerancePlugin from './packages/plugin/dist/index.mjs';

// ============================================================================
// Constants
// ============================================================================

/** File patterns for TypeScript source files. */
const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx'];

/** Executable JavaScript maintained by this repository. */
const SCRIPT_FILES = ['scripts/**/*.mjs', 'scripts/**/*.cjs'];

/** File patterns for test files and test-only infrastructure. */
const TEST_FILES = [
  '**/*.test.mjs',
  '**/*.test.ts',
  '**/*.spec.mjs',
  '**/*.spec.ts',
  '**/test-helper.ts',
];

/** ESLint rule implementation files. */
const ESLINT_RULE_FILES = ['packages/plugin/src/rules/*.ts'];

/** ESLint rule test files. */
const ESLINT_RULE_TEST_FILES = ['packages/plugin/src/rules/*.test.ts'];

/** ECMAScript version for parser options */
const ECMA_VERSION = 2020;

/** Maximum complexity allowed */
const MAX_COMPLEXITY = 4;

/** Maximum function lines allowed in internal codebase */
const MAX_FUNCTION_LINES = 15;

/** Maximum parameters allowed */
const MAX_PARAMS = 4;

/** Maximum nesting depth allowed */
const MAX_DEPTH = 3;

/** Root directory for type-aware parser resolution */
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Strict zero-tolerance rules used to dogfood the plugin across this repository. */
const ZERO_TOLERANCE_STRICT_RULES = zeroTolerancePlugin.configs.strict.rules;

/** Jest global variables for test files */
const JEST_GLOBALS = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  jest: 'readonly',
  test: 'readonly',
};

/** Language-independent quality rules shared by source files and scripts. */
const CORE_QUALITY_RULES = {
  complexity: ['error', { max: MAX_COMPLEXITY }],
  'max-depth': ['error', MAX_DEPTH],
  'no-restricted-syntax': [
    'error',
    {
      message: 'Avoid nested ternaries; use explicit conditionals for readability.',
      selector: 'ConditionalExpression ConditionalExpression',
    },
    {
      message: 'Avoid forEach(async ...); use for...of with await or Promise.all with map.',
      selector:
        "CallExpression[callee.type='MemberExpression'][callee.property.name='forEach'] > :matches(FunctionExpression, ArrowFunctionExpression)[async=true]",
    },
  ],
  'no-warning-comments': ['error', { terms: ['TODO', 'FIXME', 'XXX'], location: 'start' }],
};

/** Files and directories to ignore */
const IGNORE_PATTERNS = [
  '**/*.d.ts',
  '**/coverage/**',
  '**/dist/**',
  '**/jest.config.js',
  '**/node_modules/**',
  'test/consumers/**',
  'pnpm-lock.yaml',
];

// ============================================================================
// Configuration Sections
// ============================================================================

/**
 * Base configuration for TypeScript and JavaScript files.
 * Includes parser setup, plugins, and core rule definitions.
 */
const baseConfig = {
  files: TYPESCRIPT_FILES,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: ECMA_VERSION,
      projectService: {
        allowDefaultProject: [
          'packages/plugin/tsup.config.ts',
          'packages/plugin/typescript-eslint-utils-runtime.ts',
        ],
        defaultProject: 'packages/plugin/tsconfig.tools.json',
      },
      sourceType: 'module',
      tsconfigRootDir: ROOT_DIR,
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    'zero-tolerance': zeroTolerancePlugin,
  },
  rules: {
    ...CORE_QUALITY_RULES,
    // TypeScript ESLint recommended rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // We use any for type workarounds
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowHigherOrderFunctions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': [
      'error',
      { checksConditionals: true, checksSpreads: true, checksVoidReturn: true },
    ],
    '@typescript-eslint/no-unnecessary-condition': 'warn',
    '@typescript-eslint/return-await': ['error', 'always'],
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['warn', 'error'] }],

    // Zero-tolerance plugin rules (dogfooding)
    ...ZERO_TOLERANCE_STRICT_RULES,

    // Repository-specific stricter metrics
    'zero-tolerance/max-function-lines': ['error', { max: MAX_FUNCTION_LINES }],
    'zero-tolerance/max-params': ['error', { max: MAX_PARAMS }],
  },
};

/** Node.js quality checks for repository scripts. */
const scriptConfig = {
  files: SCRIPT_FILES,
  languageOptions: {
    ecmaVersion: 'latest',
    globals: {
      URL: 'readonly',
      console: 'readonly',
      process: 'readonly',
    },
    sourceType: 'module',
  },
  plugins: {
    'zero-tolerance': zeroTolerancePlugin,
  },
  rules: {
    ...CORE_QUALITY_RULES,
    'zero-tolerance/require-jsdoc-functions': 'error',
  },
};

/**
 * Configuration for test files.
 * Adds Jest globals and relaxes some rules appropriate for test code.
 */
const testConfig = {
  files: TEST_FILES,
  languageOptions: {
    globals: JEST_GLOBALS,
    parserOptions: {
      projectService: false,
    },
  },
  rules: {
    // Relax production-only constraints for test ergonomics
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/return-await': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    complexity: 'off',
    'max-depth': 'off',
    'no-warning-comments': 'off',
    'zero-tolerance/max-function-lines': 'off',
  },
};

/** Generic correctness checks for ESLint rule implementations. */
const eslintRuleConfig = {
  files: ESLINT_RULE_FILES,
  plugins: eslintPlugin.configs['rules-recommended'].plugins,
  rules: {
    ...eslintPlugin.configs['rules-recommended'].rules,
    // createRule follows typescript-eslint's top-level defaultOptions contract.
    'eslint-plugin/require-meta-default-options': 'off',
    // Existing public option schemas predate descriptions; enforce this after migration.
    'eslint-plugin/require-meta-schema-description': 'off',
  },
};

/** Generic correctness checks for ESLint RuleTester suites. */
const eslintRuleTestConfig = {
  files: ESLINT_RULE_TEST_FILES,
  plugins: eslintPlugin.configs['tests-recommended'].plugins,
  rules: eslintPlugin.configs['tests-recommended'].rules,
};

/**
 * Configuration for files and directories to ignore.
 */
const ignoreConfig = {
  ignores: IGNORE_PATTERNS,
};

/**
 * Configuration for ESLint's own inline directive handling.
 */
const linterOptionsConfig = {
  linterOptions: {
    noInlineConfig: true,
    reportUnusedDisableDirectives: 'error',
  },
};

// ============================================================================
// Export
// ============================================================================

export default [
  eslint.configs.recommended,
  linterOptionsConfig,
  baseConfig,
  scriptConfig,
  testConfig,
  eslintRuleConfig,
  eslintRuleTestConfig,
  ignoreConfig,
];
