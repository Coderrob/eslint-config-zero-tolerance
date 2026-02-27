import type { ESLint, Linter } from 'eslint';
import { buildRules } from '../rule-map';
import { CONFIG_NAME_RECOMMENDED, PLUGIN_NAMESPACE, PRESET_RECOMMENDED } from '../constants';

/**
 * Creates the recommended flat config preset so the plugin can dogfood itself.
 * @param plugin - The ESLint plugin instance to include in the config.
 * @returns A complete ESLint flat config with recommended rule settings.
 */
export const createRecommendedConfig = (plugin: ESLint.Plugin): Linter.Config => ({
  name: CONFIG_NAME_RECOMMENDED,
  plugins: { [PLUGIN_NAMESPACE]: plugin },
  rules: buildRules(PRESET_RECOMMENDED),
});
