import type { ESLint, Linter } from 'eslint';
import interfacePrefix from './rules/interface-prefix';
import testDescriptionStyle from './rules/test-description-style';
import zodSchemaDescription from './rules/zod-schema-description';
import noBannedTypes from './rules/no-banned-types';
import noRelativeParentImports from './rules/no-relative-parent-imports';
import noDynamicImport from './rules/no-dynamic-import';
import noLiteralUnions from './rules/no-literal-unions';
import noExportAlias from './rules/no-export-alias';
import noJestHaveBeenCalled from './rules/no-jest-have-been-called';
import noMockImplementation from './rules/no-mock-implementation';
import requireJsdocFunctions from './rules/require-jsdoc-functions';
import packageJson from '../package.json';

const rules = {
  'interface-prefix': interfacePrefix,
  'test-description-style': testDescriptionStyle,
  'zod-schema-description': zodSchemaDescription,
  'no-banned-types': noBannedTypes,
  'no-relative-parent-imports': noRelativeParentImports,
  'no-dynamic-import': noDynamicImport,
  'no-literal-unions': noLiteralUnions,
  'no-export-alias': noExportAlias,
  'no-jest-have-been-called': noJestHaveBeenCalled,
  'no-mock-implementation': noMockImplementation,
  'require-jsdoc-functions': requireJsdocFunctions,
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
    'zero-tolerance/interface-prefix': 'warn',
    'zero-tolerance/test-description-style': 'warn',
    'zero-tolerance/zod-schema-description': 'warn',
    'zero-tolerance/no-banned-types': 'warn',
    'zero-tolerance/no-relative-parent-imports': 'warn',
    'zero-tolerance/no-dynamic-import': 'warn',
    'zero-tolerance/no-literal-unions': 'warn',
    'zero-tolerance/no-export-alias': 'warn',
    'zero-tolerance/no-jest-have-been-called': 'warn',
    'zero-tolerance/no-mock-implementation': 'warn',
    'zero-tolerance/require-jsdoc-functions': 'warn',
  },
};

const strictConfig: Linter.Config = {
  name: 'zero-tolerance/strict',
  plugins: {
    'zero-tolerance': plugin as any,
  },
  rules: {
    'zero-tolerance/interface-prefix': 'error',
    'zero-tolerance/test-description-style': 'error',
    'zero-tolerance/zod-schema-description': 'error',
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-relative-parent-imports': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-literal-unions': 'error',
    'zero-tolerance/no-export-alias': 'error',
    'zero-tolerance/no-jest-have-been-called': 'error',
    'zero-tolerance/no-mock-implementation': 'error',
    'zero-tolerance/require-jsdoc-functions': 'error',
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
    'zero-tolerance/interface-prefix': 'warn',
    'zero-tolerance/test-description-style': 'warn',
    'zero-tolerance/zod-schema-description': 'warn',
    'zero-tolerance/no-banned-types': 'warn',
    'zero-tolerance/no-relative-parent-imports': 'warn',
    'zero-tolerance/no-dynamic-import': 'warn',
    'zero-tolerance/no-literal-unions': 'warn',
    'zero-tolerance/no-export-alias': 'warn',
    'zero-tolerance/no-jest-have-been-called': 'warn',
    'zero-tolerance/no-mock-implementation': 'warn',
    'zero-tolerance/require-jsdoc-functions': 'warn',
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
    'zero-tolerance/interface-prefix': 'error',
    'zero-tolerance/test-description-style': 'error',
    'zero-tolerance/zod-schema-description': 'error',
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-relative-parent-imports': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-literal-unions': 'error',
    'zero-tolerance/no-export-alias': 'error',
    'zero-tolerance/no-jest-have-been-called': 'error',
    'zero-tolerance/no-mock-implementation': 'error',
    'zero-tolerance/require-jsdoc-functions': 'error',
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
