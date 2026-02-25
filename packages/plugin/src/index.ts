import type { ESLint, Linter } from 'eslint';
import requireInterfacePrefix from './rules/require-interface-prefix';
import requireTestDescriptionStyle from './rules/require-test-description-style';
import requireZodSchemaDescription from './rules/require-zod-schema-description';
import noMagicNumbers from './rules/no-magic-numbers';
import noMagicStrings from './rules/no-magic-strings';
import noBannedTypes from './rules/no-banned-types';
import noRelativeParentImports from './rules/no-relative-parent-imports';
import noDynamicImport from './rules/no-dynamic-import';
import noLiteralUnions from './rules/no-literal-unions';
import noExportAlias from './rules/no-export-alias';
import noJestHaveBeenCalled from './rules/no-jest-have-been-called';
import noMockImplementation from './rules/no-mock-implementation';
import requireJsdocFunctions from './rules/require-jsdoc-functions';
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
import packageJson from '../package.json';

const rules = {
  'require-interface-prefix': requireInterfacePrefix,
  'require-test-description-style': requireTestDescriptionStyle,
  'require-zod-schema-description': requireZodSchemaDescription,
  'no-magic-numbers': noMagicNumbers,
  'no-magic-strings': noMagicStrings,
  'no-banned-types': noBannedTypes,
  'no-relative-parent-imports': noRelativeParentImports,
  'no-dynamic-import': noDynamicImport,
  'no-literal-unions': noLiteralUnions,
  'no-export-alias': noExportAlias,
  'no-jest-have-been-called': noJestHaveBeenCalled,
  'no-mock-implementation': noMockImplementation,
  'require-jsdoc-functions': requireJsdocFunctions,
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
} as any;

// Plugin definition
const plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules,
} as any as ESLint.Plugin;

// Flat config presets
const recommendedConfig: Linter.Config = {
  name: 'zero-tolerance/recommended',
  plugins: {
    'zero-tolerance': plugin as any,
  },
  rules: {
    'zero-tolerance/require-interface-prefix': 'warn',
    'zero-tolerance/require-test-description-style': 'warn',
    'zero-tolerance/require-zod-schema-description': 'warn',
    'zero-tolerance/no-banned-types': 'warn',
    'zero-tolerance/no-relative-parent-imports': 'warn',
    'zero-tolerance/no-dynamic-import': 'warn',
    'zero-tolerance/no-literal-unions': 'warn',
    'zero-tolerance/no-export-alias': 'warn',
    'zero-tolerance/no-jest-have-been-called': 'warn',
    'zero-tolerance/no-mock-implementation': 'warn',
    'zero-tolerance/require-jsdoc-functions': 'warn',
    'zero-tolerance/no-type-assertion': 'warn',
    'zero-tolerance/no-eslint-disable': 'warn',
    'zero-tolerance/sort-imports': 'warn',
    'zero-tolerance/sort-functions': 'warn',
    'zero-tolerance/no-magic-numbers': 'warn',
    'zero-tolerance/no-magic-strings': 'warn',
    'zero-tolerance/max-function-lines': ['warn', { max: 30 }] as any,
    'zero-tolerance/max-params': ['warn', { max: 4 }] as any,
    'zero-tolerance/no-identical-expressions': 'warn',
    'zero-tolerance/no-redundant-boolean': 'warn',
    'zero-tolerance/no-empty-catch': 'warn',
    'zero-tolerance/no-non-null-assertion': 'warn',
    'zero-tolerance/no-await-in-loop': 'warn',
  },
};

const strictConfig: Linter.Config = {
  name: 'zero-tolerance/strict',
  plugins: {
    'zero-tolerance': plugin as any,
  },
  rules: {
    'zero-tolerance/require-interface-prefix': 'error',
    'zero-tolerance/require-test-description-style': 'error',
    'zero-tolerance/require-zod-schema-description': 'error',
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-relative-parent-imports': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-literal-unions': 'error',
    'zero-tolerance/no-export-alias': 'error',
    'zero-tolerance/no-jest-have-been-called': 'error',
    'zero-tolerance/no-mock-implementation': 'error',
    'zero-tolerance/require-jsdoc-functions': 'error',
    'zero-tolerance/no-type-assertion': 'error',
    'zero-tolerance/no-eslint-disable': 'error',
    'zero-tolerance/sort-imports': 'error',
    'zero-tolerance/sort-functions': 'error',
    'zero-tolerance/no-magic-numbers': 'error',
    'zero-tolerance/no-magic-strings': 'error',
    'zero-tolerance/max-function-lines': ['error', { max: 20 }] as any,
    'zero-tolerance/max-params': ['error', { max: 4 }] as any,
    'zero-tolerance/no-identical-expressions': 'error',
    'zero-tolerance/no-redundant-boolean': 'error',
    'zero-tolerance/no-empty-catch': 'error',
    'zero-tolerance/no-non-null-assertion': 'error',
    'zero-tolerance/no-await-in-loop': 'error',
  },
};

// Legacy config format (for backward compatibility with ESLint <9)
const legacyRecommendedConfig = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['zero-tolerance'],
  rules: {
    'zero-tolerance/require-interface-prefix': 'warn',
    'zero-tolerance/require-test-description-style': 'warn',
    'zero-tolerance/require-zod-schema-description': 'warn',
    'zero-tolerance/no-banned-types': 'warn',
    'zero-tolerance/no-relative-parent-imports': 'warn',
    'zero-tolerance/no-dynamic-import': 'warn',
    'zero-tolerance/no-literal-unions': 'warn',
    'zero-tolerance/no-export-alias': 'warn',
    'zero-tolerance/no-jest-have-been-called': 'warn',
    'zero-tolerance/no-mock-implementation': 'warn',
    'zero-tolerance/require-jsdoc-functions': 'warn',
    'zero-tolerance/no-type-assertion': 'warn',
    'zero-tolerance/no-eslint-disable': 'warn',
    'zero-tolerance/sort-imports': 'warn',
    'zero-tolerance/sort-functions': 'warn',
    'zero-tolerance/no-magic-numbers': 'warn',
    'zero-tolerance/no-magic-strings': 'warn',
    'zero-tolerance/max-function-lines': ['warn', { max: 30 }],
    'zero-tolerance/max-params': ['warn', { max: 4 }],
    'zero-tolerance/no-identical-expressions': 'warn',
    'zero-tolerance/no-redundant-boolean': 'warn',
    'zero-tolerance/no-empty-catch': 'warn',
    'zero-tolerance/no-non-null-assertion': 'warn',
    'zero-tolerance/no-await-in-loop': 'warn',
  },
};

const legacyStrictConfig = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['zero-tolerance'],
  rules: {
    'zero-tolerance/require-interface-prefix': 'error',
    'zero-tolerance/require-test-description-style': 'error',
    'zero-tolerance/require-zod-schema-description': 'error',
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-relative-parent-imports': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-literal-unions': 'error',
    'zero-tolerance/no-export-alias': 'error',
    'zero-tolerance/no-jest-have-been-called': 'error',
    'zero-tolerance/no-mock-implementation': 'error',
    'zero-tolerance/require-jsdoc-functions': 'error',
    'zero-tolerance/no-type-assertion': 'error',
    'zero-tolerance/no-eslint-disable': 'error',
    'zero-tolerance/sort-imports': 'error',
    'zero-tolerance/sort-functions': 'error',
    'zero-tolerance/no-magic-numbers': 'error',
    'zero-tolerance/no-magic-strings': 'error',
    'zero-tolerance/max-function-lines': ['error', { max: 20 }],
    'zero-tolerance/max-params': ['error', { max: 4 }],
    'zero-tolerance/no-identical-expressions': 'error',
    'zero-tolerance/no-redundant-boolean': 'error',
    'zero-tolerance/no-empty-catch': 'error',
    'zero-tolerance/no-non-null-assertion': 'error',
    'zero-tolerance/no-await-in-loop': 'error',
  },
};

// Default export for ESLint (both flat and legacy)
const eslintPlugin: any = {
  meta: plugin.meta,
  rules,
  configs: {
    // Flat configs
    recommended: recommendedConfig,
    strict: strictConfig,
    // Legacy configs (for ESLint <9)
    'legacy-recommended': legacyRecommendedConfig,
    'legacy-strict': legacyStrictConfig,
  },
};

export = eslintPlugin;
