import eslintPlugin from './index';
import { buildRules, ruleMap } from './rule-map';
import {
  CONFIG_KEY_LEGACY_RECOMMENDED,
  CONFIG_KEY_LEGACY_STRICT,
  CONFIG_NAME_RECOMMENDED,
  CONFIG_NAME_STRICT,
  PLUGIN_NAMESPACE,
  PLUGIN_PACKAGE_NAME,
  PRESET_RECOMMENDED,
  PRESET_STRICT,
  TYPESCRIPT_ESLINT_PARSER,
} from './constants';
import {
  createRecommendedConfig,
  createStrictConfig,
  legacyRecommendedConfig,
  legacyStrictConfig,
} from './configs';

const RULE_NO_EXPORT_ALIAS = `${PLUGIN_NAMESPACE}/no-export-alias`;
const RULE_MAX_FUNCTION_LINES = `${PLUGIN_NAMESPACE}/max-function-lines`;
const RULE_SORT_IMPORTS = `${PLUGIN_NAMESPACE}/sort-imports`;
const RULE_KEY_SORT_IMPORTS = 'sort-imports';
const RULE_KEY_NO_LITERAL_UNIONS = 'no-literal-unions';

describe('plugin wiring', () => {
  it('should build prefixed recommended and strict rule maps', () => {
    const recommendedRules = buildRules(PRESET_RECOMMENDED);
    const strictRules = buildRules(PRESET_STRICT);

    expect(recommendedRules[RULE_NO_EXPORT_ALIAS]).toBe('warn');
    expect(strictRules[RULE_NO_EXPORT_ALIAS]).toBe('error');
    expect(recommendedRules[RULE_MAX_FUNCTION_LINES]).toEqual(['warn', { max: 20 }]);
    expect(strictRules[RULE_MAX_FUNCTION_LINES]).toEqual(['error', { max: 10 }]);
    expect(Object.keys(recommendedRules)).toHaveLength(Object.keys(ruleMap).length);
    expect(Object.keys(strictRules)).toHaveLength(Object.keys(ruleMap).length);
  });

  it('should create flat configs with plugin registration and named presets', () => {
    const recommended = createRecommendedConfig(eslintPlugin);
    const strict = createStrictConfig(eslintPlugin);

    expect(recommended.name).toBe(CONFIG_NAME_RECOMMENDED);
    expect(strict.name).toBe(CONFIG_NAME_STRICT);
    expect(recommended.plugins?.[PLUGIN_NAMESPACE]).toBe(eslintPlugin);
    expect(strict.plugins?.[PLUGIN_NAMESPACE]).toBe(eslintPlugin);
    expect(recommended.rules?.[RULE_NO_EXPORT_ALIAS]).toBe('warn');
    expect(strict.rules?.[RULE_NO_EXPORT_ALIAS]).toBe('error');
  });

  it('should expose legacy configs with parser options and mapped rules', () => {
    expect(legacyRecommendedConfig.parser).toBe(TYPESCRIPT_ESLINT_PARSER);
    expect(legacyRecommendedConfig.plugins).toEqual([PLUGIN_NAMESPACE]);
    expect(legacyRecommendedConfig.rules?.[RULE_SORT_IMPORTS]).toBe('warn');
    expect(legacyStrictConfig.rules?.[RULE_SORT_IMPORTS]).toBe('error');
  });

  it('should export plugin metadata, rules, and all config presets from index', () => {
    expect(eslintPlugin.meta?.name).toBe(PLUGIN_PACKAGE_NAME);
    expect(eslintPlugin.meta?.version).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_SORT_IMPORTS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_LITERAL_UNIONS]).toBeDefined();
    expect(eslintPlugin.configs.recommended.name).toBe(CONFIG_NAME_RECOMMENDED);
    expect(eslintPlugin.configs.strict.name).toBe(CONFIG_NAME_STRICT);
    expect(eslintPlugin.configs[CONFIG_KEY_LEGACY_RECOMMENDED]).toBe(legacyRecommendedConfig);
    expect(eslintPlugin.configs[CONFIG_KEY_LEGACY_STRICT]).toBe(legacyStrictConfig);
  });
});
