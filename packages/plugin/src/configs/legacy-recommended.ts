import type { Linter } from 'eslint';
import { buildRules } from '../rule-map';
import { legacyParserOptions } from './legacy-base';

/**
 * Legacy config preset mirroring the recommended flat set.
 */
export const legacyRecommendedConfig: Linter.LegacyConfig = {
  ...legacyParserOptions,
  rules: buildRules('recommended'),
};
