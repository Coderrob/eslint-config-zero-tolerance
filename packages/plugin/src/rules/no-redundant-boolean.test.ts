import { ruleTester } from '../testing/test-helper';
import { noRedundantBoolean } from './no-redundant-boolean';

describe('no-redundant-boolean', () => {
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
      {
        name: 'should preserve strict comparison when the operand may be a number',
        code: 'const result = value === true;',
      },
      {
        name: 'should preserve strict inequality when the operand may be a string',
        code: 'const result = value !== false;',
      },
      {
        name: 'should preserve a comment inside a boolean comparison',
        code: 'const result = (value > 0) === /* keep */ true;',
      },
      {
        name: 'should preserve a comment inside a boolean ternary',
        code: 'const result = condition ? /* keep */ true : false;',
      },
      {
        name: 'should preserve a comment inside a double negation',
        code: 'const result = !! /* keep */ (value > 0);',
      },
    ],
    invalid: [
      {
        name: 'should simplify equality with true for a comparison expression',
        code: 'const ok = (value > 0) === true;',
        output: 'const ok = value > 0;',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should simplify inequality with false for a comparison expression',
        code: 'const ok = (value > 0) !== false;',
        output: 'const ok = value > 0;',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should simplify boolean literal on the left side',
        code: 'const ok = true === (value > 0);',
        output: 'const ok = value > 0;',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should negate inequality with true for a comparison expression',
        code: 'const ok = (value > 0) !== true;',
        output: 'const ok = !(value > 0);',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should negate equality with false for a comparison expression',
        code: 'const ok = (value > 0) === false;',
        output: 'const ok = !(value > 0);',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should coerce an unknown ternary condition to boolean',
        code: 'const ok = condition ? true : false;',
        output: 'const ok = !!(condition);',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should negate an unknown ternary condition',
        code: 'const ok = condition ? false : true;',
        output: 'const ok = !(condition);',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should keep a boolean ternary condition without coercion',
        code: 'const ok = value > 0 ? true : false;',
        output: 'const ok = value > 0;',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should remove double negation of boolean comparison',
        code: 'const ok = !!(value > 0);',
        output: 'const ok = (value > 0);',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should preserve addition precedence when removing double negation',
        code: 'const result = 1 + !!(value > 0);',
        output: 'const result = 1 + (value > 0);',
        errors: [{ messageId: 'redundantBoolean' }],
      },
      {
        name: 'should preserve typeof precedence when removing double negation',
        code: 'const result = typeof !!(value > 0);',
        output: 'const result = typeof (value > 0);',
        errors: [{ messageId: 'redundantBoolean' }],
      },
    ],
  });
});
