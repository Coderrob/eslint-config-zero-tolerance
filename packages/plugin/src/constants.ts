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
export const PLUGIN_PACKAGE_NAME = '@coderrob/eslint-plugin-zero-tolerance';

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
