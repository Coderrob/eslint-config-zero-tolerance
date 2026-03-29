import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noWith } from './no-with';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    sourceType: 'script',
  },
});

ruleTester.run('no-with', noWith, {
  valid: [
    {
      name: 'should allow regular property access',
      code: 'const fullName = person.firstName + person.lastName;',
    },
    {
      name: 'should allow object destructuring',
      code: 'const { firstName, lastName } = person; const fullName = firstName + lastName;',
    },
  ],
  invalid: [
    {
      name: 'should report with statement usage',
      code: 'with (person) { fullName = firstName + lastName; }',
      errors: [{ messageId: 'noWith' }],
    },
    {
      name: 'should report nested with statement usage',
      code: 'if (enabled) { with (person) { run(firstName); } }',
      errors: [{ messageId: 'noWith' }],
    },
  ],
});
