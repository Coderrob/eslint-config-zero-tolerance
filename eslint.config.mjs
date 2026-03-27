// @ts-check

/**
 * ESLint configuration for the zero-tolerance monorepo.
 *
 * This configuration enforces strict coding standards across TypeScript and JavaScript files,
 * including dogfooding the zero-tolerance ESLint plugin rules.
 */

import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zeroTolerancePlugin from './packages/plugin/dist/index.mjs';

// ============================================================================
// Constants
// ============================================================================

/** File patterns for TypeScript source files */
const TS_JS_FILES = ['**/*.ts', '**/*.tsx'];

/** File patterns for test files */
const TEST_FILES = ['**/*.test.ts', '**/*.spec.ts'];

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

/** Files and directories to ignore */
const IGNORE_PATTERNS = [
  '**/*.d.ts',
  '**/dist/**',
  '**/jest.config.js',
  '**/node_modules/**',
  '**/scripts/**',
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
  files: TS_JS_FILES,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: ECMA_VERSION,
      projectService: true,
      sourceType: 'module',
      tsconfigRootDir: ROOT_DIR,
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    'zero-tolerance': zeroTolerancePlugin,
  },
  rules: {
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
    complexity: ['error', { max: MAX_COMPLEXITY }],
    'max-depth': ['error', MAX_DEPTH],
    'no-console': ['error', { allow: ['warn', 'error'] }],
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

    // Zero-tolerance plugin rules (dogfooding)
    // Code quality and style
    'zero-tolerance/require-interface-prefix': 'error',
    'zero-tolerance/sort-imports': 'error',
    'zero-tolerance/sort-functions': 'error',

    // Documentation and naming
    'zero-tolerance/require-jsdoc-anonymous-functions': 'error',
    'zero-tolerance/require-jsdoc-functions': 'error',
    'zero-tolerance/require-test-description-style': 'error',

    // Type safety and assertions
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-literal-unions': 'error',
    'zero-tolerance/no-type-assertion': 'error',
    'zero-tolerance/no-non-null-assertion': 'error',

    // Import/export patterns
    'zero-tolerance/no-re-export': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-export-alias': 'error',

    // Error handling
    'zero-tolerance/no-empty-catch': 'error',
    'zero-tolerance/no-throw-literal': 'error',

    // Control flow and async
    'zero-tolerance/no-await-in-loop': 'error',
    'zero-tolerance/no-floating-promises': 'error',

    // Code analysis
    'zero-tolerance/no-identical-expressions': 'error',
    'zero-tolerance/no-redundant-boolean': 'error',
    'zero-tolerance/no-eslint-disable': 'error',

    // Code metrics
    'zero-tolerance/no-magic-numbers': 'error',
    'zero-tolerance/no-magic-strings': 'error',
    'zero-tolerance/max-function-lines': ['error', { max: MAX_FUNCTION_LINES }],
    'zero-tolerance/max-params': ['error', { max: MAX_PARAMS }],
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
    'zero-tolerance/no-dynamic-import': 'off',
    'zero-tolerance/no-magic-numbers': 'off',
    'zero-tolerance/no-type-assertion': 'off',
  },
};

/**
 * Configuration for files and directories to ignore.
 */
const ignoreConfig = {
  ignores: IGNORE_PATTERNS,
};

// ============================================================================
// Export
// ============================================================================

export default [eslint.configs.recommended, baseConfig, testConfig, ignoreConfig];
