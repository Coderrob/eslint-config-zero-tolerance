/**
 * The ESLint plugin namespace used as the prefix for all rule names and as
 * the plugin key in flat config `plugins` records.
 */
export const PLUGIN_NAMESPACE = 'zero-tolerance';

/** Fully-qualified flat config name for the recommended preset. */
export const CONFIG_NAME_RECOMMENDED = `${PLUGIN_NAMESPACE}/recommended`;

/** Fully-qualified flat config name for the strict preset. */
export const CONFIG_NAME_STRICT = `${PLUGIN_NAMESPACE}/strict`;

/**
 * ESLint preset identifiers used when selecting rule severities from the
 * canonical rule map.
 */
export const PRESET_RECOMMENDED = 'recommended' as const;
export const PRESET_STRICT = 'strict' as const;

/** Union of all valid preset identifiers. */
export type Preset = typeof PRESET_RECOMMENDED | typeof PRESET_STRICT;

/** Parser package name required by legacy (ESLint <9) config consumers. */
export const TYPESCRIPT_ESLINT_PARSER = '@typescript-eslint/parser';

/** npm package name of the plugin, as declared in package.json. */
export const PLUGIN_PACKAGE_NAME = 'eslint-plugin-zero-tolerance';

/** Config map key for the legacy recommended preset. */
export const CONFIG_KEY_LEGACY_RECOMMENDED = 'legacy-recommended';

/** Config map key for the legacy strict preset. */
export const CONFIG_KEY_LEGACY_STRICT = 'legacy-strict';

/**
 * Base URL used by every rule's `ESLintUtils.RuleCreator` documentation link.
 */
export const RULE_CREATOR_URL = 'https://github.com/Coderrob/eslint-config-zero-tolerance#';

/**
 * Fallback display name used when a function node has no resolvable identifier.
 */
export const ANONYMOUS_FUNCTION_NAME = '<anonymous>';
