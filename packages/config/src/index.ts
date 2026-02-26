import type { Linter } from 'eslint';
import zeroTolerancePlugin from 'eslint-plugin-zero-tolerance';

/**
 * All config presets, re-exported directly from eslint-plugin-zero-tolerance.
 * Rules are derived from the canonical rule map — no manual sync required here.
 */
export const recommended: Linter.Config = zeroTolerancePlugin.configs.recommended;
export const strict: Linter.Config = zeroTolerancePlugin.configs.strict;
export const legacyRecommended: Linter.LegacyConfig = zeroTolerancePlugin.configs['legacy-recommended'];
export const legacyStrict: Linter.LegacyConfig = zeroTolerancePlugin.configs['legacy-strict'];

const configs: {
  recommended: Linter.Config;
  strict: Linter.Config;
  legacyRecommended: Linter.LegacyConfig;
  legacyStrict: Linter.LegacyConfig;
} = { recommended, strict, legacyRecommended, legacyStrict };

export default configs;
