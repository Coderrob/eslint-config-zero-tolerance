import type { Linter } from 'eslint';
import { PLUGIN_NAMESPACE, TYPESCRIPT_ESLINT_PARSER } from '../constants';

/**
 * Shared parser options for legacy ESLint config consumers (ESLint <9).
 */
export const legacyParserOptions: Pick<
  Linter.LegacyConfig,
  'parser' | 'parserOptions' | 'plugins'
> = {
  parser: TYPESCRIPT_ESLINT_PARSER,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [PLUGIN_NAMESPACE],
};
