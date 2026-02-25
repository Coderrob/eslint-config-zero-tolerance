import type { Linter } from 'eslint';
import zeroTolerancePlugin from 'eslint-plugin-zero-tolerance';

const strict: Linter.Config = {
  name: 'zero-tolerance/strict',
  plugins: {
    'zero-tolerance': zeroTolerancePlugin as any,
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
  },
};

export default strict;
