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
import zeroTolerancePlugin from './packages/plugin/dist/index.mjs';

// ============================================================================
// Constants
// ============================================================================

/** File patterns for TypeScript and JavaScript files */
const TS_JS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mjs'];

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
      sourceType: 'module',
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    'zero-tolerance': zeroTolerancePlugin,
  },
  rules: {
    // TypeScript ESLint recommended rules
    '@typescript-eslint/no-explicit-any': 'off', // We use any for type workarounds
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    complexity: ['error', { max: MAX_COMPLEXITY }],

    // Zero-tolerance plugin rules (dogfooding)
    // Code quality and style
    'zero-tolerance/require-interface-prefix': 'error',
    'zero-tolerance/sort-imports': 'error',
    'zero-tolerance/sort-functions': 'error',

    // Documentation and naming
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
  },
  rules: {
    // Relax production-only constraints for test ergonomics
    complexity: 'off',
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
