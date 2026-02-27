import type { ESLint, Linter } from 'eslint';
import { buildRules } from '../rule-map';
import { CONFIG_NAME_STRICT, PLUGIN_NAMESPACE, PRESET_STRICT } from '../constants';

/**
 * Creates the strict flat config preset with error-level enforcement.
 * @param plugin - The ESLint plugin instance to include in the config.
 * @returns A complete ESLint flat config with strict rule settings.
 */
export const createStrictConfig = (plugin: ESLint.Plugin): Linter.Config => ({
  name: CONFIG_NAME_STRICT,
  plugins: { [PLUGIN_NAMESPACE]: plugin },
  rules: buildRules(PRESET_STRICT),
});
