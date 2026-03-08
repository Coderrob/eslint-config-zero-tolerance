import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { noRedundantBoolean } from './no-redundant-boolean';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-redundant-boolean', noRedundantBoolean, {
  valid: [
    {
      name: 'should allow direct boolean value usage',
      code: 'if (isActive) {}',
    },
    {
      name: 'should allow negated value',
      code: 'if (!isValid) {}',
    },
    {
      name: 'should allow comparison without boolean literal',
      code: 'const ok = x > 0;',
    },
    {
      name: 'should allow comparison between non-literals',
      code: 'if (a === b) {}',
    },
    {
      name: 'should allow loose equality with boolean',
      code: 'if (value == true) {}',
    },
    {
      name: 'should allow strict comparison to non-boolean literal',
      code: 'if (value === 1) {}',
    },
  ],
  invalid: [
    {
      name: 'should report strict equality with true',
      code: 'if (isActive === true) {}',
      output: 'if (isActive) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report strict inequality with false',
      code: 'if (isActive !== false) {}',
      output: 'if (isActive) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report boolean literal on the left side',
      code: 'if (true === isActive) {}',
      output: 'if (isActive) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report assignment with boolean comparison',
      code: 'const ok = isValid === true;',
      output: 'const ok = isValid;',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report strict inequality with true',
      code: 'if (result !== true) {}',
      output: 'if (!(result)) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report strict equality with false',
      code: 'if (result === false) {}',
      output: 'if (!(result)) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report strict inequality with false',
      code: 'if (result !== false) {}',
      output: 'if (result) {}',
      errors: [{ messageId: 'redundantBoolean' }],
    },
  ],
});
