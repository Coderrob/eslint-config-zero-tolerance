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

import type { ESLint } from 'eslint';
import requireInterfacePrefix from './rules/require-interface-prefix';
import requireTestDescriptionStyle from './rules/require-test-description-style';
import requireZodSchemaDescription from './rules/require-zod-schema-description';
import noMagicNumbers from './rules/no-magic-numbers';
import noMagicStrings from './rules/no-magic-strings';
import noBannedTypes from './rules/no-banned-types';
import noDynamicImport from './rules/no-dynamic-import';
import noLiteralUnions from './rules/no-literal-unions';
import noExportAlias from './rules/no-export-alias';
import noReExport from './rules/no-re-export';
import noJestHaveBeenCalled from './rules/no-jest-have-been-called';
import noMockImplementation from './rules/no-mock-implementation';
import requireJsdocFunctions from './rules/require-jsdoc-functions';
import requireOptionalChaining from './rules/require-optional-chaining';
import noTypeAssertion from './rules/no-type-assertion';
import noEslintDisable from './rules/no-eslint-disable';
import sortImports from './rules/sort-imports';
import sortFunctions from './rules/sort-functions';
import maxFunctionLines from './rules/max-function-lines';
import maxParams from './rules/max-params';
import noIdenticalExpressions from './rules/no-identical-expressions';
import noRedundantBoolean from './rules/no-redundant-boolean';
import noEmptyCatch from './rules/no-empty-catch';
import noNonNullAssertion from './rules/no-non-null-assertion';
import noAwaitInLoop from './rules/no-await-in-loop';
import noThrowLiteral from './rules/no-throw-literal';
import packageJson from '../package.json';
import {
  createRecommendedConfig,
  createStrictConfig,
  legacyRecommendedConfig,
  legacyStrictConfig,
} from './configs';

type PluginWithConfigs = Omit<ESLint.Plugin, 'configs'> & {
  configs: {
    recommended: ReturnType<typeof createRecommendedConfig>;
    strict: ReturnType<typeof createStrictConfig>;
    'legacy-recommended': typeof legacyRecommendedConfig;
    'legacy-strict': typeof legacyStrictConfig;
  };
};

/**
 * Registry of all rule implementations exposed by the plugin.
 *
 * This object is kept as the canonical runtime source for `plugin.rules`,
 * while preset severity/option mappings live separately in `src/rule-map.ts`.
 */
const rules = {
  'require-interface-prefix': requireInterfacePrefix,
  'require-test-description-style': requireTestDescriptionStyle,
  'require-zod-schema-description': requireZodSchemaDescription,
  'no-magic-numbers': noMagicNumbers,
  'no-magic-strings': noMagicStrings,
  'no-banned-types': noBannedTypes,
  'no-dynamic-import': noDynamicImport,
  'no-literal-unions': noLiteralUnions,
  'no-export-alias': noExportAlias,
  'no-re-export': noReExport,
  'no-jest-have-been-called': noJestHaveBeenCalled,
  'no-mock-implementation': noMockImplementation,
  'require-jsdoc-functions': requireJsdocFunctions,
  'require-optional-chaining': requireOptionalChaining,
  'no-type-assertion': noTypeAssertion,
  'no-eslint-disable': noEslintDisable,
  'sort-imports': sortImports,
  'sort-functions': sortFunctions,
  'max-function-lines': maxFunctionLines,
  'max-params': maxParams,
  'no-identical-expressions': noIdenticalExpressions,
  'no-redundant-boolean': noRedundantBoolean,
  'no-empty-catch': noEmptyCatch,
  'no-non-null-assertion': noNonNullAssertion,
  'no-await-in-loop': noAwaitInLoop,
  'no-throw-literal': noThrowLiteral,
} as unknown as NonNullable<ESLint.Plugin['rules']>;

/** Base plugin object shared by both flat and legacy config presets. */
const basePlugin: ESLint.Plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules,
};

/** Flat config preset with warn-level defaults. */
const recommendedConfig = createRecommendedConfig(basePlugin);
/** Flat config preset with error-level defaults. */
const strictConfig = createStrictConfig(basePlugin);

/**
 * Final plugin export including flat and legacy preset variants.
 *
 * Consumers import this package as the plugin entry point, and then reference
 * `configs.recommended` / `configs.strict` (or legacy variants) as needed.
 */
const eslintPlugin: PluginWithConfigs = {
  ...basePlugin,
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
    'legacy-recommended': legacyRecommendedConfig,
    'legacy-strict': legacyStrictConfig,
  },
};

export = eslintPlugin;
