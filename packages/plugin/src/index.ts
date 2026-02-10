import interfacePrefix from './rules/interface-prefix';
import testDescriptionStyle from './rules/test-description-style';
import zodSchemaDescription from './rules/zod-schema-description';
import noBannedTypes from './rules/no-banned-types';
import noRelativeParentImports from './rules/no-relative-parent-imports';
import noDynamicImport from './rules/no-dynamic-import';
import noLiteralUnions from './rules/no-literal-unions';

const rules = {
  'interface-prefix': interfacePrefix,
  'test-description-style': testDescriptionStyle,
  'zod-schema-description': zodSchemaDescription,
  'no-banned-types': noBannedTypes,
  'no-relative-parent-imports': noRelativeParentImports,
  'no-dynamic-import': noDynamicImport,
  'no-literal-unions': noLiteralUnions,
};

const recommendedConfig = {
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
  },
};

const strictConfig = {
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
  },
};

export default {
  rules,
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
  },
};
