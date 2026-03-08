import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noMagicStrings } from './no-magic-strings';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-magic-strings', noMagicStrings, {
  valid: [
    {
      code: "const STATUS = 'active';",
      name: 'should allow string in const declaration',
    },
    {
      code: "import foo from 'module';",
      name: 'should allow import source string',
    },
    {
      code: "console.log('debug message');",
      name: 'should allow string as function argument',
    },
    {
      code: "throw new Error('something went wrong');",
      name: 'should allow string in throw statement',
    },
    {
      code: "if (value === '') {}",
      name: 'should allow empty string in comparison',
    },
    {
      code: "const obj = { key: 'value' };",
      name: 'should allow string as object property value',
    },
    {
      code: "const arr = ['a', 'b'];",
      name: 'should allow strings in array literal',
    },
    {
      code: 'const n = 123;',
      name: 'should ignore non-string literals',
    },
    {
      code: "if (typeof value === 'string') {}",
      name: 'should allow typeof comparison with string literal on right side',
    },
    {
      code: "if ('undefined' === typeof value) {}",
      name: 'should allow typeof comparison with string literal on left side',
    },
    {
      code: "if (typeof value !== 'object') {}",
      name: 'should allow typeof inequality comparison',
    },
    {
      code: "if (role === 'admin') {}",
      name: 'should allow configured ignored string value',
      options: [{ ignoreValues: ['admin'] }],
    },
    {
      code: "switch (status) { case 'pending': break; }",
      name: 'should allow switch cases when switch checking is disabled',
      options: [{ checkSwitchCases: false }],
    },
    {
      code: "if (status !== 'active') {}",
      name: 'should allow comparisons when comparison checking is disabled',
      options: [{ checkComparisons: false }],
    },
  ],
  invalid: [
    {
      code: "if (role === 'admin') {}",
      name: 'should disallow magic string in strict equality comparison',
      errors: [
        {
          messageId: 'noMagicStrings',
          data: { value: 'admin' },
        },
      ],
    },
    {
      code: "if (status !== 'active') {}",
      name: 'should disallow magic string in strict inequality comparison',
      errors: [
        {
          messageId: 'noMagicStrings',
          data: { value: 'active' },
        },
      ],
    },
    {
      code: "switch (status) { case 'pending': break; }",
      name: 'should disallow magic string in switch case',
      errors: [
        {
          messageId: 'noMagicStrings',
          data: { value: 'pending' },
        },
      ],
    },
    {
      code: "if (type == 'user') {}",
      name: 'should disallow magic string in loose equality comparison',
      errors: [
        {
          messageId: 'noMagicStrings',
          data: { value: 'user' },
        },
      ],
    },
    {
      code: "if (env != 'production') {}",
      name: 'should disallow magic string in loose inequality comparison',
      errors: [
        {
          messageId: 'noMagicStrings',
          data: { value: 'production' },
        },
      ],
    },
    {
      code: "switch (role) { case 'admin': break; case 'user': break; }",
      name: 'should disallow multiple magic strings in switch cases',
      errors: [
        {
          messageId: 'noMagicStrings',
          data: { value: 'admin' },
        },
        {
          messageId: 'noMagicStrings',
          data: { value: 'user' },
        },
      ],
    },
  ],
});
