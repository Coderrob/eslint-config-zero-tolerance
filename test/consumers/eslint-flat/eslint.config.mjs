import parser from '@typescript-eslint/parser';
import plugin from '@coderrob/eslint-plugin-zero-tolerance';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser },
    plugins: { 'zero-tolerance': plugin },
    rules: { 'zero-tolerance/no-date-now': 'error' },
  },
];
