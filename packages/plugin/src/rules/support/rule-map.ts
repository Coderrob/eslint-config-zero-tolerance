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

import type { Linter } from 'eslint';
import { PLUGIN_NAMESPACE, Preset } from '../../constants';

const WARN_LEVEL = 'warn';
const ERROR_LEVEL = 'error';
const OFF_LEVEL = 'off';
const MAX_FUNCTION_LINES_RECOMMENDED_MAX = 30;
const MAX_FUNCTION_LINES_STRICT_MAX = 25;
const MAX_PARAMS_MAX = 4;

const DEFAULT_RULE_NAMES: string[] = [
  'require-clean-barrel',
  'require-interface-prefix',
  'require-test-description-style',
  'no-array-mutation',
  'no-banned-types',
  'no-boolean-return-trap',
  'no-date-now',
  'no-destructured-parameter-type-literal',
  'no-dynamic-import',
  'no-literal-unions',
  'no-export-alias',
  'no-re-export',
  'no-jest-have-been-called',
  'no-inline-type-import',
  'no-mock-implementation',
  'require-jsdoc-functions',
  'require-optional-chaining',
  'require-readonly-props',
  'no-type-assertion',
  'no-eslint-disable',
  'sort-imports',
  'sort-functions',
  'no-magic-numbers',
  'no-magic-strings',
  'no-identical-expressions',
  'no-identical-branches',
  'no-redundant-boolean',
  'no-empty-catch',
  'no-non-null-assertion',
  'no-await-in-loop',
  'no-throw-literal',
  'no-parameter-reassign',
  'no-object-mutation',
  'no-flag-argument',
  'no-floating-promises',
  'no-for-in',
  'no-labels',
  'no-barrel-parent-imports',
  'no-with',
  'prefer-guard-clauses',
  'prefer-nullish-coalescing',
  'prefer-readonly-parameters',
  'prefer-shortcut-return',
  'prefer-string-raw',
  'no-query-side-effects',
];

const MAX_FUNCTION_LINES_RULE = 'max-function-lines';
const MAX_PARAMS_RULE = 'max-params';

type RuleEntryTuple = readonly [string, IRuleConfig];

/** Per-rule severity and options for each config preset. */
export interface IRuleConfig {
  recommended: Linter.RuleEntry;
  strict: Linter.RuleEntry;
}

/**
 * Creates a prefixed ESLint rule key.
 *
 * @param ruleName - Unprefixed plugin rule name.
 * @returns Rule key with plugin namespace.
 */
function buildPrefixedRuleName(ruleName: string): string {
  return `${PLUGIN_NAMESPACE}/${ruleName}`;
}

/**
 * Builds prefixed ESLint rules for the requested preset.
 *
 * @param preset - Requested preset.
 * @returns Rules record for ESLint config consumption.
 */
export function buildRules(preset: Preset): Linter.RulesRecord {
  const rules: Linter.RulesRecord = {};
  for (const [name, config] of Object.entries(ruleMap)) {
    const [prefixedName, ruleEntry] = mapRuleForPreset(name, config, preset);
    rules[prefixedName] = ruleEntry;
  }
  return rules;
}

/**
 * Builds a rule map entry for one default rule name.
 *
 * @param ruleName - Rule name.
 * @returns Canonical rule tuple.
 */
function createDefaultRuleEntry(ruleName: string): RuleEntryTuple {
  return createRuleEntry(ruleName);
}

/**
 * Creates a canonical rule-map entry with default warn/error severities.
 *
 * @param ruleName - Rule name.
 * @param recommended - Recommended preset configuration.
 * @param strict - Strict preset configuration.
 * @returns Rule-entry tuple.
 */
function createRuleEntry(
  ruleName: string,
  recommended: Linter.RuleEntry = WARN_LEVEL,
  strict: Linter.RuleEntry = ERROR_LEVEL,
): RuleEntryTuple {
  return [ruleName, { recommended, strict }];
}

/**
 * Selects the preset-specific rule configuration.
 *
 * @param config - Rule config for all presets.
 * @param preset - Requested preset.
 * @returns The matching rule entry.
 */
function getPresetRuleConfig(config: IRuleConfig, preset: Preset): Linter.RuleEntry {
  return preset === Preset.Strict ? config.strict : config.recommended;
}

/**
 * Converts one rule entry tuple into a prefixed ESLint rules tuple.
 *
 * @param ruleName - Rule name.
 * @param config - Rule config.
 * @param preset - Requested preset.
 * @returns Prefixed rule tuple for ESLint rules record construction.
 */
function mapRuleForPreset(
  ruleName: string,
  config: IRuleConfig,
  preset: Preset,
): readonly [string, Linter.RuleEntry] {
  return [buildPrefixedRuleName(ruleName), getPresetRuleConfig(config, preset)];
}

/**
 * Canonical single source of truth for every rule's recommended and strict
 * configuration.
 */
const ruleEntries: RuleEntryTuple[] = [
  ...DEFAULT_RULE_NAMES.map(createDefaultRuleEntry),
  createRuleEntry(
    MAX_FUNCTION_LINES_RULE,
    [WARN_LEVEL, { max: MAX_FUNCTION_LINES_RECOMMENDED_MAX }],
    [ERROR_LEVEL, { max: MAX_FUNCTION_LINES_STRICT_MAX }],
  ),
  createRuleEntry(
    MAX_PARAMS_RULE,
    [WARN_LEVEL, { max: MAX_PARAMS_MAX }],
    [ERROR_LEVEL, { max: MAX_PARAMS_MAX }],
  ),
  createRuleEntry('prefer-result-return', OFF_LEVEL, WARN_LEVEL),
  createRuleEntry('no-parent-internal-access', OFF_LEVEL, OFF_LEVEL),
  createRuleEntry('require-jsdoc-anonymous-functions', OFF_LEVEL, WARN_LEVEL),
  createRuleEntry('require-bdd-spec', OFF_LEVEL, OFF_LEVEL),
];

export const ruleMap: Record<string, IRuleConfig> = Object.fromEntries(ruleEntries);
