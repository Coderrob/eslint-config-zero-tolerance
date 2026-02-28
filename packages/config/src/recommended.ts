import type { Linter } from 'eslint';
import zeroTolerancePlugin from 'eslint-plugin-zero-tolerance';

/**
 * Recommended config preset (warn severity).
 * Rules are derived from the canonical rule map in eslint-plugin-zero-tolerance.
 */
const recommendedConfig: Linter.Config = zeroTolerancePlugin.configs.recommended;

export default recommendedConfig;
