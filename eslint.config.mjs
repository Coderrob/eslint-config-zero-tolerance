// @ts-check
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import zeroTolerancePlugin from './packages/plugin/dist/index.mjs';

const zeroToleranceRulesOff = Object.fromEntries(
  Object.keys(zeroTolerancePlugin.rules ?? {}).map((ruleName) => [`zero-tolerance/${ruleName}`, 'off'])
);

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
    files: ['packages/plugin/src/**/*.ts'],
    rules: {
      // The plugin implementation intentionally contains patterns that its own
      // rules prohibit (e.g. AST node type strings, test harness casts).
      ...zeroToleranceRulesOff,
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
        test: 'readonly',
      },
    },
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
