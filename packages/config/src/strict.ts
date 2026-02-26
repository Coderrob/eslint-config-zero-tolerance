import type { Linter } from 'eslint';
import zeroTolerancePlugin from 'eslint-plugin-zero-tolerance';

/**
 * Strict config preset (error severity).
 * Rules are derived from the canonical rule map in eslint-plugin-zero-tolerance.
 */
const strictConfig: Linter.Config = zeroTolerancePlugin.configs.strict;

export default strictConfig;
