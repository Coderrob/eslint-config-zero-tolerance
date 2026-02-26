import eslintPlugin = require('./index');
import { buildRules, ruleMap } from './rule-map';
import {
  createRecommendedConfig,
  createStrictConfig,
  legacyRecommendedConfig,
  legacyStrictConfig,
} from './configs';

describe('plugin wiring', () => {
  it('should build prefixed recommended and strict rule maps', () => {
    const recommendedRules = buildRules('recommended');
    const strictRules = buildRules('strict');

    expect(recommendedRules['zero-tolerance/no-export-alias']).toBe('warn');
    expect(strictRules['zero-tolerance/no-export-alias']).toBe('error');
    expect(recommendedRules['zero-tolerance/max-function-lines']).toEqual(['warn', { max: 30 }]);
    expect(strictRules['zero-tolerance/max-function-lines']).toEqual(['error', { max: 20 }]);
    expect(Object.keys(recommendedRules)).toHaveLength(Object.keys(ruleMap).length);
    expect(Object.keys(strictRules)).toHaveLength(Object.keys(ruleMap).length);
  });

  it('should create flat configs with plugin registration and named presets', () => {
    const recommended = createRecommendedConfig(eslintPlugin);
    const strict = createStrictConfig(eslintPlugin);

    expect(recommended.name).toBe('zero-tolerance/recommended');
    expect(strict.name).toBe('zero-tolerance/strict');
    expect(recommended.plugins?.['zero-tolerance']).toBe(eslintPlugin);
    expect(strict.plugins?.['zero-tolerance']).toBe(eslintPlugin);
    expect(recommended.rules?.['zero-tolerance/no-export-alias']).toBe('warn');
    expect(strict.rules?.['zero-tolerance/no-export-alias']).toBe('error');
  });

  it('should expose legacy configs with parser options and mapped rules', () => {
    expect(legacyRecommendedConfig.parser).toBe('@typescript-eslint/parser');
    expect(legacyRecommendedConfig.plugins).toEqual(['zero-tolerance']);
    expect(legacyRecommendedConfig.rules?.['zero-tolerance/sort-imports']).toBe('warn');
    expect(legacyStrictConfig.rules?.['zero-tolerance/sort-imports']).toBe('error');
  });

  it('should export plugin metadata, rules, and all config presets from index', () => {
    expect(eslintPlugin.meta?.name).toBe('eslint-plugin-zero-tolerance');
    expect(eslintPlugin.meta?.version).toBeDefined();
    expect(eslintPlugin.rules?.['sort-imports']).toBeDefined();
    expect(eslintPlugin.rules?.['no-literal-unions']).toBeDefined();
    expect(eslintPlugin.configs.recommended.name).toBe('zero-tolerance/recommended');
    expect(eslintPlugin.configs.strict.name).toBe('zero-tolerance/strict');
    expect(eslintPlugin.configs['legacy-recommended']).toBe(legacyRecommendedConfig);
    expect(eslintPlugin.configs['legacy-strict']).toBe(legacyStrictConfig);
  });
});
