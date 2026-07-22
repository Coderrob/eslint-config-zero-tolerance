module.exports = {
  extends: ['plugin:@coderrob/zero-tolerance/legacy-recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@coderrob/zero-tolerance'],
  rules: { '@coderrob/zero-tolerance/no-date-now': 'error' },
};
