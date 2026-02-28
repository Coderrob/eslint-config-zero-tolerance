import type { Linter } from 'eslint';
import { buildRules } from '../rule-map';
import { PRESET_STRICT } from '../constants';
import { legacyParserOptions } from './legacy-base';

/**
 * Legacy config preset that aligns with the strict flat config.
 */
export const legacyStrictConfig: Linter.LegacyConfig = {
  ...legacyParserOptions,
  rules: buildRules(PRESET_STRICT),
};
