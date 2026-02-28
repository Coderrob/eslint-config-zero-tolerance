import type { Linter } from 'eslint';
import { PLUGIN_NAMESPACE, type Preset } from './constants';

const WARN_LEVEL = 'warn';
const ERROR_LEVEL = 'error';

// Rule limit constants
const MAX_FUNCTION_LINES_RECOMMENDED_MAX = 20;
const MAX_FUNCTION_LINES_STRICT_MAX = 10;
const MAX_PARAMS_MAX = 4;

const DEFAULT_RULE_NAMES = [
  'require-interface-prefix',
  'require-test-description-style',
  'require-zod-schema-description',
  'no-banned-types',
  'no-dynamic-import',
  'no-literal-unions',
  'no-export-alias',
  'no-re-export',
  'no-jest-have-been-called',
  'no-mock-implementation',
  'require-jsdoc-functions',
  'require-optional-chaining',
  'no-type-assertion',
  'no-eslint-disable',
  'sort-imports',
  'sort-functions',
  'no-magic-numbers',
  'no-magic-strings',
  'no-identical-expressions',
  'no-redundant-boolean',
  'no-empty-catch',
  'no-non-null-assertion',
  'no-await-in-loop',
  'no-throw-literal',
] as const;

const MAX_FUNCTION_LINES_RULE = 'max-function-lines';
const MAX_PARAMS_RULE = 'max-params';

/**
 * Per-rule severity and options for each config preset.
 */
export interface RuleConfig {
  recommended: Linter.RuleEntry;
  strict: Linter.RuleEntry;
}

type RuleName =
  | (typeof DEFAULT_RULE_NAMES)[number]
  | typeof MAX_FUNCTION_LINES_RULE
  | typeof MAX_PARAMS_RULE;

/**
 * Creates a canonical rule-map entry with default warn/error severities.
 * @param ruleName - The name of the rule to create an entry for.
 * @param recommended - The rule configuration for the recommended preset.
 * @param strict - The rule configuration for the strict preset.
 * @returns A tuple containing the rule name and its configuration object.
 */
function createRuleEntry(
  ruleName: RuleName,
  recommended: Linter.RuleEntry = WARN_LEVEL,
  strict: Linter.RuleEntry = ERROR_LEVEL,
): [RuleName, RuleConfig] {
  return [ruleName, { recommended, strict }];
}

/**
 * Canonical single source of truth for every rule's recommended and strict
 * configuration. All four config presets (flat and legacy) are derived from
 * this map — adding a rule here is the only change required to register it
 * in every preset simultaneously.
 */
const ruleEntries: Array<[RuleName, RuleConfig]> = [
  ...DEFAULT_RULE_NAMES.map((ruleName) => createRuleEntry(ruleName)),
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
];

export const ruleMap = ruleEntries.reduce<Record<string, RuleConfig>>(
  (accumulator, [ruleName, config]) => {
    accumulator[ruleName] = config;
    return accumulator;
  },
  {},
);

/**
 * Builds a prefixed ESLint rules record for the given preset by reading each
 * rule's configuration from the canonical rule map.
 * @param preset - The preset to build rules for ('recommended' or 'strict').
 * @returns An object containing all rules with their configurations for the specified preset.
 */
export function buildRules(preset: Preset): Linter.RulesRecord {
  return Object.fromEntries(
    Object.entries(ruleMap).map(([name, config]) => [
      `${PLUGIN_NAMESPACE}/${name}`,
      config[preset],
    ]),
  );
}
