import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noRedundantBoolean } from './no-redundant-boolean';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-redundant-boolean', noRedundantBoolean, {
  valid: [
    {
      name: 'should pass for direct boolean value usage',
      code: 'if (isActive) {}',
    },
    {
      name: 'should pass for negated value',
      code: 'if (!isValid) {}',
    },
    {
      name: 'should pass for comparison without boolean literal',
      code: 'const ok = x > 0;',
    },
    {
      name: 'should pass for comparison between non-literals',
      code: 'if (a === b) {}',
    },
    {
      name: 'should pass for loose equality with boolean (not flagged)',
      code: 'if (value == true) {}',
    },
  ],
  invalid: [
    {
      name: 'should error for strict equality with true',
      code: 'if (isActive === true) {}',
      output: 'if (isActive) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should error for strict inequality with false',
      code: 'if (isActive !== false) {}',
      output: 'if (isActive) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should error for boolean literal on the left side',
      code: 'if (true === isActive) {}',
      output: 'if (isActive) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should error for assignment with boolean comparison',
      code: 'const ok = isValid === true;',
      output: 'const ok = isValid;',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should error for strict inequality with true',
      code: 'if (result !== true) {}',
      output: 'if (!(result)) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
  ],
} as any);
