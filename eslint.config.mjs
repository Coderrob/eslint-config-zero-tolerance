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
      'zero-tolerance/interface-prefix': 'error',
      'zero-tolerance/test-description-style': 'error',
      'zero-tolerance/zod-schema-description': 'warn',
      'zero-tolerance/no-banned-types': 'warn',
      'zero-tolerance/no-relative-parent-imports': 'error',
      'zero-tolerance/no-dynamic-import': 'error',
      'zero-tolerance/no-literal-unions': 'warn',
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
