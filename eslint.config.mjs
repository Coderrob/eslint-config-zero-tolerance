// @ts-check
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import zeroTolerancePlugin from './packages/plugin/dist/index.mjs';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
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
      
      // Zero-tolerance plugin rules (dogfooding)
      'zero-tolerance/require-interface-prefix': 'error',
      'zero-tolerance/require-test-description-style': 'error',
      'zero-tolerance/require-zod-schema-description': 'warn',
      'zero-tolerance/no-banned-types': 'warn',
      'zero-tolerance/no-relative-parent-imports': 'error',
      'zero-tolerance/no-dynamic-import': 'error',
      'zero-tolerance/no-literal-unions': 'warn',
      'zero-tolerance/no-export-alias': 'error',
      'zero-tolerance/no-type-assertion': 'warn',
      'zero-tolerance/no-eslint-disable': 'error',
      'zero-tolerance/no-throw-literal': 'error',
      'zero-tolerance/no-empty-catch': 'error',
      'zero-tolerance/no-await-in-loop': 'error',
      'zero-tolerance/no-identical-expressions': 'error',
      'zero-tolerance/no-redundant-boolean': 'error',
      'zero-tolerance/no-non-null-assertion': 'warn',
      'zero-tolerance/no-magic-numbers': 'warn',
      'zero-tolerance/no-magic-strings': 'warn',
      'zero-tolerance/sort-imports': 'warn',
      'zero-tolerance/max-function-lines': ['warn', { max: 40 }],
      'zero-tolerance/max-params': ['warn', { max: 4 }],
    },
  },
  {
    files: ['**/packages/plugin/src/index.ts'],
    rules: {
      // Allow importing package.json from src/
      'zero-tolerance/no-relative-parent-imports': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Relax some rules for tests
      'zero-tolerance/no-dynamic-import': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts',
      'pnpm-lock.yaml',
      '**/jest.config.js',
      '**/scripts/**',
    ],
  },
];
