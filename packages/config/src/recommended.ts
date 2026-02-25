import type { Linter } from 'eslint';
import zeroTolerancePlugin from 'eslint-plugin-zero-tolerance';

const recommended: Linter.Config = {
  name: 'zero-tolerance/recommended',
  plugins: {
    'zero-tolerance': zeroTolerancePlugin as any,
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
  },
};

export default recommended;
