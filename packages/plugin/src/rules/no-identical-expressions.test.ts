import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noIdenticalExpressions } from './no-identical-expressions';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-identical-expressions', noIdenticalExpressions, {
  valid: [
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
    {
      name: 'should error for identical operands with +',
      code: 'const r = a + a;',
      errors: [{ messageId: 'identicalExpressions', data: { operator: '+' } }],
    },
    {
      name: 'should error for identical member expressions with ===',
      code: 'if (obj.prop === obj.prop) {}',
      errors: [{ messageId: 'identicalExpressions', data: { operator: '===' } }],
    },
  ],
} as any);
