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

import packageJson from '../package.json';
import {
  createRecommendedConfig,
  createStrictConfig,
  legacyRecommendedConfig,
  legacyStrictConfig,
} from './configs';
import maxFunctionLines from './rules/max-function-lines';
import maxParams from './rules/max-params';
import noAwaitInLoop from './rules/no-await-in-loop';
import noBannedTypes from './rules/no-banned-types';
import noDynamicImport from './rules/no-dynamic-import';
import noEmptyCatch from './rules/no-empty-catch';
import noEslintDisable from './rules/no-eslint-disable';
import noExportAlias from './rules/no-export-alias';
import noFlagArgument from './rules/no-flag-argument';
import noFloatingPromises from './rules/no-floating-promises';
import noIdenticalBranches from './rules/no-identical-branches';
import noIdenticalExpressions from './rules/no-identical-expressions';
import noInlineTypeImport from './rules/no-inline-type-import';
import noJestHaveBeenCalled from './rules/no-jest-have-been-called';
import noLiteralUnions from './rules/no-literal-unions';
import noMagicNumbers from './rules/no-magic-numbers';
import noMagicStrings from './rules/no-magic-strings';
import noMockImplementation from './rules/no-mock-implementation';
import noNonNullAssertion from './rules/no-non-null-assertion';
import noParameterReassign from './rules/no-parameter-reassign';
import noParentImports from './rules/no-parent-imports';
import noQuerySideEffects from './rules/no-query-side-effects';
import noReExport from './rules/no-re-export';
import noRedundantBoolean from './rules/no-redundant-boolean';
import noThrowLiteral from './rules/no-throw-literal';
import noTypeAssertion from './rules/no-type-assertion';
import preferGuardClauses from './rules/prefer-guard-clauses';
import preferNullishCoalescing from './rules/prefer-nullish-coalescing';
import preferShortcutReturn from './rules/prefer-shortcut-return';
import requireInterfacePrefix from './rules/require-interface-prefix';
import requireJsdocFunctions from './rules/require-jsdoc-functions';
import requireOptionalChaining from './rules/require-optional-chaining';
import requireTestDescriptionStyle from './rules/require-test-description-style';
import sortFunctions from './rules/sort-functions';
import sortImports from './rules/sort-imports';

interface IBasePlugin {
  meta: {
    name: string;
    version: string;
  };
  rules: Record<string, unknown>;
}

interface IPluginExport extends IBasePlugin {
  configs: Record<string, unknown>;
}

/**
 * Registry of all rule implementations exposed by the plugin.
 */
const rules: Record<string, unknown> = {
  'max-function-lines': maxFunctionLines,
  'max-params': maxParams,
  'no-await-in-loop': noAwaitInLoop,
  'no-banned-types': noBannedTypes,
  'no-dynamic-import': noDynamicImport,
  'no-empty-catch': noEmptyCatch,
  'no-eslint-disable': noEslintDisable,
  'no-export-alias': noExportAlias,
  'no-flag-argument': noFlagArgument,
  'no-floating-promises': noFloatingPromises,
  'no-identical-branches': noIdenticalBranches,
  'no-identical-expressions': noIdenticalExpressions,
  'no-inline-type-import': noInlineTypeImport,
  'no-jest-have-been-called': noJestHaveBeenCalled,
  'no-literal-unions': noLiteralUnions,
  'no-magic-numbers': noMagicNumbers,
  'no-magic-strings': noMagicStrings,
  'no-mock-implementation': noMockImplementation,
  'no-non-null-assertion': noNonNullAssertion,
  'no-parameter-reassign': noParameterReassign,
  'no-parent-imports': noParentImports,
  'no-query-side-effects': noQuerySideEffects,
  'no-re-export': noReExport,
  'no-redundant-boolean': noRedundantBoolean,
  'no-throw-literal': noThrowLiteral,
  'no-type-assertion': noTypeAssertion,
  'prefer-guard-clauses': preferGuardClauses,
  'prefer-shortcut-return': preferShortcutReturn,
  'prefer-nullish-coalescing': preferNullishCoalescing,
  'require-interface-prefix': requireInterfacePrefix,
  'require-jsdoc-functions': requireJsdocFunctions,
  'require-optional-chaining': requireOptionalChaining,
  'require-test-description-style': requireTestDescriptionStyle,
  'sort-functions': sortFunctions,
  'sort-imports': sortImports,
};

/** Base plugin object shared by both flat and legacy config presets. */
const basePlugin: IBasePlugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules,
};

/** Final plugin export including flat and legacy preset variants. */
const eslintPlugin: IPluginExport = {
  ...basePlugin,
  configs: {
    recommended: createRecommendedConfig(basePlugin),
    strict: createStrictConfig(basePlugin),
    'legacy-recommended': legacyRecommendedConfig,
    'legacy-strict': legacyStrictConfig,
  },
};

export = eslintPlugin;
