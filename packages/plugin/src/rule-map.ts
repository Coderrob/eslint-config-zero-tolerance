import type { Linter } from 'eslint';

/**
 * Per-rule severity and options for each config preset.
 */
export interface RuleConfig {
  recommended: Linter.RuleEntry;
  strict: Linter.RuleEntry;
}

/**
 * Canonical single source of truth for every rule's recommended and strict
 * configuration. All four config presets (flat and legacy) are derived from
 * this map — adding a rule here is the only change required to register it
 * in every preset simultaneously.
 */
export const ruleMap = {
  'require-interface-prefix':       { recommended: 'warn',                 strict: 'error' },
  'require-test-description-style': { recommended: 'warn',                 strict: 'error' },
  'require-zod-schema-description': { recommended: 'warn',                 strict: 'error' },
  'no-banned-types':                { recommended: 'warn',                 strict: 'error' },
  'no-relative-parent-imports':     { recommended: 'warn',                 strict: 'error' },
  'no-dynamic-import':              { recommended: 'warn',                 strict: 'error' },
  'no-literal-unions':              { recommended: 'warn',                 strict: 'error' },
  'no-export-alias':                { recommended: 'warn',                 strict: 'error' },
  'no-jest-have-been-called':       { recommended: 'warn',                 strict: 'error' },
  'no-mock-implementation':         { recommended: 'warn',                 strict: 'error' },
  'require-jsdoc-functions':        { recommended: 'warn',                 strict: 'error' },
  'no-type-assertion':              { recommended: 'warn',                 strict: 'error' },
  'no-eslint-disable':              { recommended: 'warn',                 strict: 'error' },
  'sort-imports':                   { recommended: 'warn',                 strict: 'error' },
  'sort-functions':                 { recommended: 'warn',                 strict: 'error' },
  'no-magic-numbers':               { recommended: 'warn',                 strict: 'error' },
  'no-magic-strings':               { recommended: 'warn',                 strict: 'error' },
  'no-identical-expressions':       { recommended: 'warn',                 strict: 'error' },
  'no-redundant-boolean':           { recommended: 'warn',                 strict: 'error' },
  'no-empty-catch':                 { recommended: 'warn',                 strict: 'error' },
  'no-non-null-assertion':          { recommended: 'warn',                 strict: 'error' },
  'no-await-in-loop':               { recommended: 'warn',                 strict: 'error' },
  'no-throw-literal':               { recommended: 'warn',                 strict: 'error' },
  'max-function-lines':             { recommended: ['warn', { max: 30 }],  strict: ['error', { max: 20 }] },
  'max-params':                     { recommended: ['warn', { max: 4 }],   strict: ['error', { max: 4 }] },
} satisfies Record<string, RuleConfig>;

/**
 * Builds a prefixed ESLint rules record for the given preset by reading each
 * rule's configuration from the canonical rule map.
 */
export function buildRules(preset: 'recommended' | 'strict'): Linter.RulesRecord {
  return Object.fromEntries(
    Object.entries(ruleMap).map(([name, config]) => [
      `zero-tolerance/${name}`,
      config[preset],
    ])
  );
}
