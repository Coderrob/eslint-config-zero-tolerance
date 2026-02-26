import type { ESLint, Linter } from 'eslint';
import { buildRules } from '../rule-map';

/**
 * Creates the recommended flat config preset so the plugin can dogfood itself.
 */
export const createRecommendedConfig = (plugin: ESLint.Plugin): Linter.Config => ({
  name: 'zero-tolerance/recommended',
  plugins: { 'zero-tolerance': plugin },
  rules: buildRules('recommended'),
});
