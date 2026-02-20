import type { Linter } from 'eslint';
import zeroTolerancePlugin from 'eslint-plugin-zero-tolerance';

// Flat config presets
export const recommended: Linter.Config = {
  name: 'zero-tolerance/recommended',
  plugins: {
    'zero-tolerance': zeroTolerancePlugin as any,
  },
  rules: {
    'zero-tolerance/interface-prefix': 'warn',
    'zero-tolerance/test-description-style': 'warn',
    'zero-tolerance/zod-schema-description': 'warn',
    'zero-tolerance/no-banned-types': 'warn',
    'zero-tolerance/no-relative-parent-imports': 'warn',
    'zero-tolerance/no-dynamic-import': 'warn',
    'zero-tolerance/no-literal-unions': 'warn',
    'zero-tolerance/no-export-alias': 'warn',
    'zero-tolerance/no-jest-have-been-called': 'warn',
    'zero-tolerance/no-mock-implementation': 'warn',
    'zero-tolerance/require-jsdoc-functions': 'warn',
  },
};

export const strict: Linter.Config = {
  name: 'zero-tolerance/strict',
  plugins: {
    'zero-tolerance': zeroTolerancePlugin as any,
  },
  rules: {
    'zero-tolerance/interface-prefix': 'error',
    'zero-tolerance/test-description-style': 'error',
    'zero-tolerance/zod-schema-description': 'error',
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-relative-parent-imports': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-literal-unions': 'error',
    'zero-tolerance/no-export-alias': 'error',
    'zero-tolerance/no-jest-have-been-called': 'error',
    'zero-tolerance/no-mock-implementation': 'error',
    'zero-tolerance/require-jsdoc-functions': 'error',
  },
};

// Legacy config format (for backward compatibility with ESLint <9)
export const legacyRecommended = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['zero-tolerance'],
  rules: {
    'zero-tolerance/interface-prefix': 'warn',
    'zero-tolerance/test-description-style': 'warn',
    'zero-tolerance/zod-schema-description': 'warn',
    'zero-tolerance/no-banned-types': 'warn',
    'zero-tolerance/no-relative-parent-imports': 'warn',
    'zero-tolerance/no-dynamic-import': 'warn',
    'zero-tolerance/no-literal-unions': 'warn',
    'zero-tolerance/no-export-alias': 'warn',
    'zero-tolerance/no-jest-have-been-called': 'warn',
    'zero-tolerance/no-mock-implementation': 'warn',
    'zero-tolerance/require-jsdoc-functions': 'warn',
  },
};

export const legacyStrict = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['zero-tolerance'],
  rules: {
    'zero-tolerance/interface-prefix': 'error',
    'zero-tolerance/test-description-style': 'error',
    'zero-tolerance/zod-schema-description': 'error',
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-relative-parent-imports': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-literal-unions': 'error',
    'zero-tolerance/no-export-alias': 'error',
    'zero-tolerance/no-jest-have-been-called': 'error',
    'zero-tolerance/no-mock-implementation': 'error',
    'zero-tolerance/require-jsdoc-functions': 'error',
  },
};

export default {
  recommended,
  strict,
  legacyRecommended,
  legacyStrict,
} as any;
