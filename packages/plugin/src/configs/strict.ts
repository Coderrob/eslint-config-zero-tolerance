import type { ESLint, Linter } from 'eslint';
import { buildRules } from '../rule-map';

/**
 * Creates the strict flat config preset with error-level enforcement.
 */
export const createStrictConfig = (plugin: ESLint.Plugin): Linter.Config => ({
  name: 'zero-tolerance/strict',
  plugins: { 'zero-tolerance': plugin },
  rules: buildRules('strict'),
});
