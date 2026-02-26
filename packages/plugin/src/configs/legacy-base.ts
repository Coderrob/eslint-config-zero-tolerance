import type { Linter } from 'eslint';

/**
 * Shared parser options for legacy ESLint config consumers (ESLint <9).
 */
export const legacyParserOptions: Pick<
  Linter.LegacyConfig,
  'parser' | 'parserOptions' | 'plugins'
> = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['zero-tolerance'],
};
