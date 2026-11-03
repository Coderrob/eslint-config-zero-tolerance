import { ruleTester } from '../testing/test-helper';
import { noIdenticalExpressions } from './no-identical-expressions';

describe('no-identical-expressions', () => {
  ruleTester.run('no-identical-expressions', noIdenticalExpressions, {
    valid: [
      {
        name: 'should allow comparisons of separate regular expression objects',
        code: 'const same = /value/ === /value/;',
      },
      {
        name: 'should allow loose comparisons of separate regular expression objects',
        code: 'const same = /value/i == /value/i;',
      },
      {
        name: 'should allow optional repeated getter reads',
        code: 'const same = obj?.value === obj?.value;',
      },
      {
        name: 'should allow repeated computed getter reads',
        code: 'const same = obj["value"] === obj["value"];',
      },
      {
        name: 'should allow repeated generic calls',
        code: 'const same = next<number>() === next<number>();',
      },
      { name: 'should allow different primitive literals', code: 'const same = 1 === 2;' },
      {
        name: 'should allow repeated arithmetic',
        code: 'const doubled = text + text; const difference = next() - next();',
      },
      { name: 'should allow repeated calls', code: 'if (next() === next()) {}' },
      { name: 'should allow getter reads', code: 'if (obj.prop === obj.prop) {}' },
      { name: 'should allow updates', code: 'if (i++ === i++) {}' },
      {
        name: 'should allow private brand checks',
        code: 'class C { #x; check(other) { return #x in other; } }',
      },
      {
        name: 'should pass for different operands with ===',
        code: 'if (a === b) {}',
      },
      {
        name: 'should pass for different operands with +',
        code: 'const x = a + b;',
      },
      {
        name: 'should pass for different operands with ||',
        code: 'const y = a || b;',
      },
      {
        name: 'should pass for different operands with &&',
        code: 'const z = a && b;',
      },
      {
        name: 'should pass for different operands with !==',
        code: 'if (a !== b) {}',
      },
      {
        name: 'should pass for identical operands with unsupported operator',
        code: 'const squared = a * a;',
      },
    ],
    invalid: [
      {
        name: 'should report repeated regular expression binding',
        code: 'const expression = /value/; const same = expression === expression;',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should report parenthesized repeated identifier',
        code: 'const same = (value) === ((value));',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should report repeated bigint literals',
        code: 'const same = 1n === 1n;',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should report repeated booleans',
        code: 'const same = true !== true;',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should report repetition despite intervening comments',
        code: 'const same = value /* left */ === /* right */ value;',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should report identical literals',
        code: 'if ("x" === "x") {}',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should report nullish repetition',
        code: 'const value = x ?? x;',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should report loose self comparisons',
        code: 'const same = x == x;',
        errors: [{ messageId: 'identicalExpressions' }],
      },
      {
        name: 'should error for identical operands with ===',
        code: 'if (a === a) {}',
        errors: [{ messageId: 'identicalExpressions', data: { operator: '===' } }],
      },
      {
        name: 'should error for identical operands with !==',
        code: 'if (x !== x) {}',
        errors: [{ messageId: 'identicalExpressions', data: { operator: '!==' } }],
      },
      {
        name: 'should error for identical operands with ||',
        code: 'const r = value || value;',
        errors: [{ messageId: 'identicalExpressions', data: { operator: '||' } }],
      },
      {
        name: 'should error for identical operands with &&',
        code: 'const r = value && value;',
        errors: [{ messageId: 'identicalExpressions', data: { operator: '&&' } }],
      },
    ],
  });
});
