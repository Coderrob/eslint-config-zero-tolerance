import { ruleTester } from '../testing/test-helper';
import { noRedundantBoolean } from './no-redundant-boolean';

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
    {
      name: 'should allow double negation of non-boolean expression',
      code: 'const ok = !!value;',
    },
    {
      name: 'should allow conditional expression with non-boolean branches',
      code: 'const value = condition ? "yes" : "no";',
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
    {
      name: 'should report boolean conditional with true then false branches',
      code: 'const ok = condition ? true : false;',
      output: 'const ok = condition;',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report boolean conditional with false then true branches',
      code: 'const ok = condition ? false : true;',
      output: 'const ok = !(condition);',
      errors: [{ messageId: 'redundantBoolean' }],
    },
    {
      name: 'should report double negation of boolean comparison',
      code: 'const ok = !!(value > 0);',
      output: 'const ok = value > 0;',
      errors: [{ messageId: 'redundantBoolean' }],
    },
  ],
});
