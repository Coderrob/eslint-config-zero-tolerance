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

import zeroTolerancePlugin from '@coderrob/eslint-plugin-zero-tolerance';
import recommendedConfig from './recommended';
import strictConfig from './strict';
import configs, { legacyRecommended, legacyStrict, recommended, strict } from './index';

const RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS = 'zero-tolerance/require-jsdoc-anonymous-functions';
const LEGACY_RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS =
  '@coderrob/zero-tolerance/require-jsdoc-anonymous-functions';

/**
 * Reads one rule setting from an unknown plugin preset.
 *
 * @param config - Preset value to inspect.
 * @param ruleName - Fully qualified rule name.
 * @returns Configured rule setting, or undefined when the preset has no rule map.
 */
function getRuleSetting(config: unknown, ruleName: string): unknown {
  if (
    typeof config !== 'object' ||
    config === null ||
    !('rules' in config) ||
    typeof config.rules !== 'object' ||
    config.rules === null
  ) {
    return undefined;
  }
  return Object.entries(config.rules).find(
    ([configuredRuleName]) => configuredRuleName === ruleName,
  )?.[1];
}

describe('config package exports', () => {
  it('should expose plugin flat presets through named and default exports', () => {
    expect(recommended).toBe(zeroTolerancePlugin.configs.recommended);
    expect(strict).toBe(zeroTolerancePlugin.configs.strict);
    expect(configs.recommended).toBe(recommended);
    expect(configs.strict).toBe(strict);
  });

  it('should expose plugin legacy presets through named and default exports', () => {
    expect(legacyRecommended).toBe(zeroTolerancePlugin.configs['legacy-recommended']);
    expect(legacyStrict).toBe(zeroTolerancePlugin.configs['legacy-strict']);
    expect(configs.legacyRecommended).toBe(legacyRecommended);
    expect(configs.legacyStrict).toBe(legacyStrict);
  });

  it('should expose flat presets through their subpath source modules', () => {
    expect(recommendedConfig).toBe(recommended);
    expect(strictConfig).toBe(strict);
  });

  it('should preserve opt-in rule severity across all re-exported presets', () => {
    expect(getRuleSetting(recommended, RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS)).toBe('off');
    expect(getRuleSetting(strict, RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS)).toBe('off');
    expect(getRuleSetting(legacyRecommended, LEGACY_RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS)).toBe(
      'off',
    );
    expect(getRuleSetting(legacyStrict, LEGACY_RULE_REQUIRE_JSDOC_ANONYMOUS_FUNCTIONS)).toBe('off');
  });
});
