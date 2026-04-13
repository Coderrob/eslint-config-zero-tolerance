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
import noArrayMutation from './rules/no-array-mutation';
import noAwaitInLoop from './rules/no-await-in-loop';
import noBannedTypes from './rules/no-banned-types';
import noBarrelParentImports from './rules/no-barrel-parent-imports';
import noBooleanReturnTrap from './rules/no-boolean-return-trap';
import noDateNow from './rules/no-date-now';
import noDestructuredParameterTypeLiteral from './rules/no-destructured-parameter-type-literal';
import noDynamicImport from './rules/no-dynamic-import';
import noEmptyCatch from './rules/no-empty-catch';
import noEslintDisable from './rules/no-eslint-disable';
import noExportAlias from './rules/no-export-alias';
import noFetchInTests from './rules/no-fetch-in-tests';
import noFlagArgument from './rules/no-flag-argument';
import noFloatingPromises from './rules/no-floating-promises';
import noForIn from './rules/no-for-in';
import noIdenticalBranches from './rules/no-identical-branches';
import noIdenticalExpressions from './rules/no-identical-expressions';
import noInlineTypeImport from './rules/no-inline-type-import';
import noJestHaveBeenCalled from './rules/no-jest-have-been-called';
import noLabels from './rules/no-labels';
import noLiteralPropertyUnions from './rules/no-literal-property-unions';
import noLiteralUnions from './rules/no-literal-unions';
import noMagicNumbers from './rules/no-magic-numbers';
import noMagicStrings from './rules/no-magic-strings';
import noMockImplementation from './rules/no-mock-implementation';
import noNonNullAssertion from './rules/no-non-null-assertion';
import noObjectMutation from './rules/no-object-mutation';
import noParameterReassign from './rules/no-parameter-reassign';
import noParentInternalAccess from './rules/no-parent-internal-access';
import noQuerySideEffects from './rules/no-query-side-effects';
import noReExport from './rules/no-re-export';
import noRedundantBoolean from './rules/no-redundant-boolean';
import noRestrictedImportsInTests from './rules/no-restricted-imports-in-tests';
import noSetIntervalInTests from './rules/no-set-interval-in-tests';
import noSetTimeoutInTests from './rules/no-set-timeout-in-tests';
import noTestInterfaceDeclaration from './rules/no-test-interface-declaration';
import noThrowLiteral from './rules/no-throw-literal';
import noTypeAssertion from './rules/no-type-assertion';
import noWith from './rules/no-with';
import preferGuardClauses from './rules/prefer-guard-clauses';
import preferNullishCoalescing from './rules/prefer-nullish-coalescing';
import preferObjectSpread from './rules/prefer-object-spread';
import preferReadonlyParameters from './rules/prefer-readonly-parameters';
import preferResultReturn from './rules/prefer-result-return';
import preferShortcutReturn from './rules/prefer-shortcut-return';
import preferStringRaw from './rules/prefer-string-raw';
import requireBddSpec from './rules/require-bdd-spec';
import requireCleanBarrel from './rules/require-clean-barrel';
import requireExportedObjectType from './rules/require-exported-object-type';
import requireInterfacePrefix from './rules/require-interface-prefix';
import requireJsdocAnonymousFunctions from './rules/require-jsdoc-anonymous-functions';
import requireJsdocFunctions from './rules/require-jsdoc-functions';
import requireNodeProtocol from './rules/require-node-protocol';
import requireOptionalChaining from './rules/require-optional-chaining';
import requireReadonlyProps from './rules/require-readonly-props';
import requireTestDescriptionStyle from './rules/require-test-description-style';
import requireUnionTypeAlias from './rules/require-union-type-alias';
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
  'no-array-mutation': noArrayMutation,
  'no-await-in-loop': noAwaitInLoop,
  'no-banned-types': noBannedTypes,
  'no-boolean-return-trap': noBooleanReturnTrap,
  'no-date-now': noDateNow,
  'no-destructured-parameter-type-literal': noDestructuredParameterTypeLiteral,
  'no-dynamic-import': noDynamicImport,
  'no-empty-catch': noEmptyCatch,
  'no-eslint-disable': noEslintDisable,
  'no-export-alias': noExportAlias,
  'no-fetch-in-tests': noFetchInTests,
  'no-flag-argument': noFlagArgument,
  'no-floating-promises': noFloatingPromises,
  'no-for-in': noForIn,
  'no-identical-branches': noIdenticalBranches,
  'no-identical-expressions': noIdenticalExpressions,
  'no-inline-type-import': noInlineTypeImport,
  'no-jest-have-been-called': noJestHaveBeenCalled,
  'no-labels': noLabels,
  'no-literal-property-unions': noLiteralPropertyUnions,
  'no-literal-unions': noLiteralUnions,
  'no-magic-numbers': noMagicNumbers,
  'no-magic-strings': noMagicStrings,
  'no-mock-implementation': noMockImplementation,
  'no-non-null-assertion': noNonNullAssertion,
  'no-object-mutation': noObjectMutation,
  'prefer-object-spread': preferObjectSpread,
  'no-parent-internal-access': noParentInternalAccess,
  'no-parameter-reassign': noParameterReassign,
  'no-barrel-parent-imports': noBarrelParentImports,
  'no-query-side-effects': noQuerySideEffects,
  'no-re-export': noReExport,
  'no-redundant-boolean': noRedundantBoolean,
  'no-restricted-imports-in-tests': noRestrictedImportsInTests,
  'no-set-interval-in-tests': noSetIntervalInTests,
  'no-set-timeout-in-tests': noSetTimeoutInTests,
  'no-test-interface-declaration': noTestInterfaceDeclaration,
  'no-throw-literal': noThrowLiteral,
  'no-type-assertion': noTypeAssertion,
  'no-with': noWith,
  'prefer-guard-clauses': preferGuardClauses,
  'prefer-nullish-coalescing': preferNullishCoalescing,
  'prefer-readonly-parameters': preferReadonlyParameters,
  'prefer-result-return': preferResultReturn,
  'prefer-shortcut-return': preferShortcutReturn,
  'prefer-string-raw': preferStringRaw,
  'require-clean-barrel': requireCleanBarrel,
  'require-exported-object-type': requireExportedObjectType,
  'require-interface-prefix': requireInterfacePrefix,
  'require-bdd-spec': requireBddSpec,
  'require-jsdoc-anonymous-functions': requireJsdocAnonymousFunctions,
  'require-jsdoc-functions': requireJsdocFunctions,
  'require-node-protocol': requireNodeProtocol,
  'require-optional-chaining': requireOptionalChaining,
  'require-readonly-props': requireReadonlyProps,
  'require-test-description-style': requireTestDescriptionStyle,
  'require-union-type-alias': requireUnionTypeAlias,
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
