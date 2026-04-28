/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createRecommendedConfig,
  createStrictConfig,
  legacyRecommendedConfig,
  legacyStrictConfig,
} from './configs';
import {
  CONFIG_KEY_LEGACY_RECOMMENDED,
  CONFIG_KEY_LEGACY_STRICT,
  CONFIG_NAME_RECOMMENDED,
  CONFIG_NAME_STRICT,
  PLUGIN_NAMESPACE,
  PLUGIN_PACKAGE_NAME,
  Preset,
  TYPESCRIPT_ESLINT_PARSER,
} from './constants';
import { buildRules, ruleMap } from './rules/support/rule-map';
import eslintPlugin from './index';

const RULE_NO_EXPORT_ALIAS = `${PLUGIN_NAMESPACE}/no-export-alias`;
const RULE_MAX_FUNCTION_LINES = `${PLUGIN_NAMESPACE}/max-function-lines`;
const RULE_NO_DESTRUCTURED_PARAMETER_TYPE_LITERAL = `${PLUGIN_NAMESPACE}/no-destructured-parameter-type-literal`;
const RULE_NO_EXPLICIT_ANY = `${PLUGIN_NAMESPACE}/no-explicit-any`;
const RULE_NO_FOR_IN = `${PLUGIN_NAMESPACE}/no-for-in`;
const RULE_NO_INDEXED_ACCESS_TYPES = `${PLUGIN_NAMESPACE}/no-indexed-access-types`;
const RULE_NO_MAP_SET_MUTATION = `${PLUGIN_NAMESPACE}/no-map-set-mutation`;
const RULE_NO_MATH_RANDOM = `${PLUGIN_NAMESPACE}/no-math-random`;
const RULE_PREFER_RESULT_RETURN = `${PLUGIN_NAMESPACE}/prefer-result-return`;
const RULE_NO_PROCESS_ENV_OUTSIDE_CONFIG = `${PLUGIN_NAMESPACE}/no-process-env-outside-config`;
const RULE_NO_RETURN_TYPE = `${PLUGIN_NAMESPACE}/no-return-type`;
const RULE_REQUIRE_BARREL_RELATIVE_EXPORTS = `${PLUGIN_NAMESPACE}/require-barrel-relative-exports`;
const RULE_REQUIRE_BDD_SPEC = `${PLUGIN_NAMESPACE}/require-bdd-spec`;
const RULE_REQUIRE_CLEAN_BARREL = `${PLUGIN_NAMESPACE}/require-clean-barrel`;
const RULE_REQUIRE_EXHAUSTIVE_SWITCH = `${PLUGIN_NAMESPACE}/require-exhaustive-switch`;
const RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS = `${PLUGIN_NAMESPACE}/require-jsdoc-anonymous-functions`;
const RULE_PREFER_STRUCTURED_CLONE = `${PLUGIN_NAMESPACE}/prefer-structured-clone`;
const RULE_SORT_IMPORTS = `${PLUGIN_NAMESPACE}/sort-imports`;
const RULE_NO_PARENT_INTERNAL_ACCESS = `${PLUGIN_NAMESPACE}/no-parent-internal-access`;
const RULE_REQUIRE_EXPORTED_OBJECT_TYPE = `${PLUGIN_NAMESPACE}/require-exported-object-type`;
const RULE_NO_LITERAL_PROPERTY_UNIONS = `${PLUGIN_NAMESPACE}/no-literal-property-unions`;
const RULE_NO_FETCH_IN_TESTS = `${PLUGIN_NAMESPACE}/no-fetch-in-tests`;
const RULE_NO_RESTRICTED_IMPORTS_IN_TESTS = `${PLUGIN_NAMESPACE}/no-restricted-imports-in-tests`;
const RULE_NO_SET_INTERVAL_IN_TESTS = `${PLUGIN_NAMESPACE}/no-set-interval-in-tests`;
const RULE_NO_SET_TIMEOUT_IN_TESTS = `${PLUGIN_NAMESPACE}/no-set-timeout-in-tests`;
const RULE_KEY_SORT_IMPORTS = 'sort-imports';
const RULE_KEY_NO_DESTRUCTURED_PARAMETER_TYPE_LITERAL = 'no-destructured-parameter-type-literal';
const RULE_KEY_NO_EXPLICIT_ANY = 'no-explicit-any';
const RULE_KEY_NO_FETCH_IN_TESTS = 'no-fetch-in-tests';
const RULE_KEY_NO_INDEXED_ACCESS_TYPES = 'no-indexed-access-types';
const RULE_KEY_NO_LITERAL_PROPERTY_UNIONS = 'no-literal-property-unions';
const RULE_KEY_NO_LITERAL_UNIONS = 'no-literal-unions';
const RULE_KEY_NO_MAP_SET_MUTATION = 'no-map-set-mutation';
const RULE_KEY_NO_MATH_RANDOM = 'no-math-random';
const RULE_KEY_NO_BARREL_PARENT_IMPORTS = 'no-barrel-parent-imports';
const RULE_KEY_NO_PARENT_INTERNAL_ACCESS = 'no-parent-internal-access';
const RULE_KEY_NO_PROCESS_ENV_OUTSIDE_CONFIG = 'no-process-env-outside-config';
const RULE_KEY_NO_RESTRICTED_IMPORTS_IN_TESTS = 'no-restricted-imports-in-tests';
const RULE_KEY_NO_RETURN_TYPE = 'no-return-type';
const RULE_KEY_NO_SET_INTERVAL_IN_TESTS = 'no-set-interval-in-tests';
const RULE_KEY_NO_SET_TIMEOUT_IN_TESTS = 'no-set-timeout-in-tests';
const RULE_KEY_REQUIRE_BARREL_RELATIVE_EXPORTS = 'require-barrel-relative-exports';
const RULE_KEY_REQUIRE_CLEAN_BARREL = 'require-clean-barrel';
const RULE_KEY_REQUIRE_EXHAUSTIVE_SWITCH = 'require-exhaustive-switch';
const RULE_KEY_REQUIRE_EXPORTED_OBJECT_TYPE = 'require-exported-object-type';
const RULE_KEY_PREFER_STRUCTURED_CLONE = 'prefer-structured-clone';
const RULE_NO_BARREL_PARENT_IMPORTS = `${PLUGIN_NAMESPACE}/no-barrel-parent-imports`;

describe('plugin wiring', () => {
  it('should build prefixed recommended and strict rule maps', () => {
    const recommendedRules = buildRules(Preset.Recommended);
    const strictRules = buildRules(Preset.Strict);

    expect(recommendedRules[RULE_NO_EXPORT_ALIAS]).toBe('warn');
    expect(strictRules[RULE_NO_EXPORT_ALIAS]).toBe('error');
    expect(recommendedRules[RULE_NO_DESTRUCTURED_PARAMETER_TYPE_LITERAL]).toBe('warn');
    expect(strictRules[RULE_NO_DESTRUCTURED_PARAMETER_TYPE_LITERAL]).toBe('error');
    expect(recommendedRules[RULE_NO_EXPLICIT_ANY]).toBe('warn');
    expect(strictRules[RULE_NO_EXPLICIT_ANY]).toBe('error');
    expect(recommendedRules[RULE_MAX_FUNCTION_LINES]).toEqual(['warn', { max: 30 }]);
    expect(strictRules[RULE_MAX_FUNCTION_LINES]).toEqual(['error', { max: 25 }]);
    expect(recommendedRules[RULE_NO_FOR_IN]).toBe('warn');
    expect(strictRules[RULE_NO_FOR_IN]).toBe('error');
    expect(recommendedRules[RULE_NO_INDEXED_ACCESS_TYPES]).toBe('warn');
    expect(strictRules[RULE_NO_INDEXED_ACCESS_TYPES]).toBe('error');
    expect(recommendedRules[RULE_NO_MAP_SET_MUTATION]).toBe('warn');
    expect(strictRules[RULE_NO_MAP_SET_MUTATION]).toBe('error');
    expect(recommendedRules[RULE_NO_MATH_RANDOM]).toBe('warn');
    expect(strictRules[RULE_NO_MATH_RANDOM]).toBe('error');
    expect(recommendedRules[RULE_PREFER_RESULT_RETURN]).toBe('off');
    expect(strictRules[RULE_PREFER_RESULT_RETURN]).toBe('warn');
    expect(recommendedRules[RULE_NO_PROCESS_ENV_OUTSIDE_CONFIG]).toBe('warn');
    expect(strictRules[RULE_NO_PROCESS_ENV_OUTSIDE_CONFIG]).toBe('error');
    expect(recommendedRules[RULE_NO_RETURN_TYPE]).toBe('warn');
    expect(strictRules[RULE_NO_RETURN_TYPE]).toBe('error');
    expect(recommendedRules[RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS]).toBe('off');
    expect(strictRules[RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS]).toBe('warn');
    expect(recommendedRules[RULE_REQUIRE_BARREL_RELATIVE_EXPORTS]).toBe('warn');
    expect(strictRules[RULE_REQUIRE_BARREL_RELATIVE_EXPORTS]).toBe('error');
    expect(recommendedRules[RULE_REQUIRE_CLEAN_BARREL]).toBe('warn');
    expect(strictRules[RULE_REQUIRE_CLEAN_BARREL]).toBe('error');
    expect(recommendedRules[RULE_REQUIRE_EXHAUSTIVE_SWITCH]).toBe('warn');
    expect(strictRules[RULE_REQUIRE_EXHAUSTIVE_SWITCH]).toBe('error');
    expect(recommendedRules[RULE_REQUIRE_EXPORTED_OBJECT_TYPE]).toBe('warn');
    expect(strictRules[RULE_REQUIRE_EXPORTED_OBJECT_TYPE]).toBe('error');
    expect(recommendedRules[RULE_PREFER_STRUCTURED_CLONE]).toBe('warn');
    expect(strictRules[RULE_PREFER_STRUCTURED_CLONE]).toBe('error');
    expect(recommendedRules[RULE_NO_LITERAL_PROPERTY_UNIONS]).toBe('warn');
    expect(strictRules[RULE_NO_LITERAL_PROPERTY_UNIONS]).toBe('error');
    expect(recommendedRules[RULE_REQUIRE_BDD_SPEC]).toBe('off');
    expect(strictRules[RULE_REQUIRE_BDD_SPEC]).toBe('off');
    expect(recommendedRules[RULE_NO_BARREL_PARENT_IMPORTS]).toBe('warn');
    expect(strictRules[RULE_NO_BARREL_PARENT_IMPORTS]).toBe('error');
    expect(recommendedRules[RULE_NO_PARENT_INTERNAL_ACCESS]).toBe('off');
    expect(strictRules[RULE_NO_PARENT_INTERNAL_ACCESS]).toBe('off');
    expect(recommendedRules[RULE_NO_FETCH_IN_TESTS]).toBe('off');
    expect(strictRules[RULE_NO_FETCH_IN_TESTS]).toBe('off');
    expect(recommendedRules[RULE_NO_RESTRICTED_IMPORTS_IN_TESTS]).toBe('off');
    expect(strictRules[RULE_NO_RESTRICTED_IMPORTS_IN_TESTS]).toBe('off');
    expect(recommendedRules[RULE_NO_SET_INTERVAL_IN_TESTS]).toBe('warn');
    expect(strictRules[RULE_NO_SET_INTERVAL_IN_TESTS]).toBe('error');
    expect(recommendedRules[RULE_NO_SET_TIMEOUT_IN_TESTS]).toBe('warn');
    expect(strictRules[RULE_NO_SET_TIMEOUT_IN_TESTS]).toBe('error');
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
    expect(eslintPlugin.rules?.[RULE_KEY_NO_DESTRUCTURED_PARAMETER_TYPE_LITERAL]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_EXPLICIT_ANY]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_LITERAL_PROPERTY_UNIONS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_LITERAL_UNIONS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_BARREL_PARENT_IMPORTS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_FETCH_IN_TESTS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_INDEXED_ACCESS_TYPES]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_MAP_SET_MUTATION]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_MATH_RANDOM]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_PARENT_INTERNAL_ACCESS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_PROCESS_ENV_OUTSIDE_CONFIG]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_RESTRICTED_IMPORTS_IN_TESTS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_RETURN_TYPE]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_SET_INTERVAL_IN_TESTS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_NO_SET_TIMEOUT_IN_TESTS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_REQUIRE_BARREL_RELATIVE_EXPORTS]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_REQUIRE_CLEAN_BARREL]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_REQUIRE_EXHAUSTIVE_SWITCH]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_REQUIRE_EXPORTED_OBJECT_TYPE]).toBeDefined();
    expect(eslintPlugin.rules?.[RULE_KEY_PREFER_STRUCTURED_CLONE]).toBeDefined();
    expect(eslintPlugin.configs.recommended.name).toBe(CONFIG_NAME_RECOMMENDED);
    expect(eslintPlugin.configs.strict.name).toBe(CONFIG_NAME_STRICT);
    expect(eslintPlugin.configs[CONFIG_KEY_LEGACY_RECOMMENDED]).toBe(legacyRecommendedConfig);
    expect(eslintPlugin.configs[CONFIG_KEY_LEGACY_STRICT]).toBe(legacyStrictConfig);
  });
});
