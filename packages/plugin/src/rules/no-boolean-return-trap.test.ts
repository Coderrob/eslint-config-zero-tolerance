import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noBooleanReturnTrap } from './no-boolean-return-trap';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-boolean-return-trap', noBooleanReturnTrap, {
  valid: [
    {
      name: 'should allow predicate-style boolean function',
      code: 'function isReady(value: number): boolean { return value > 0; }',
    },
    {
      name: 'should allow predicate-style promise boolean function',
      code: 'async function canProceed(): Promise<boolean> { return true; }',
    },
    {
      name: 'should allow non-boolean return type',
      code: 'function buildResult(): string { return "ok"; }',
    },
    {
      name: 'should allow function without explicit return type',
      code: 'const buildResult = () => true;',
    },
    {
      name: 'should allow non-predicate function returning qualified promise-like type',
      code: `
        namespace Api {
          export type Promise<T> = T;
        }
        function validateUser(): Api.Promise<boolean> { return true; }
      `,
    },
    {
      name: 'should allow non-predicate function returning promise type alias without type arguments',
      code: `
        type Promise = { ok: boolean };
        function validateUser(): Promise { return { ok: true }; }
      `,
    },
    {
      name: 'should allow anonymous callback function',
      code: 'items.filter(function (value): boolean { return value > 0; });',
    },
  ],
  invalid: [
    {
      name: 'should disallow non-predicate function returning boolean',
      code: 'function validateUser(): boolean { return true; }',
      errors: [{ messageId: 'noBooleanReturnTrap', data: { name: 'validateUser' } }],
    },
    {
      name: 'should disallow arrow function returning boolean with non-predicate name',
      code: 'const validateUser = (): boolean => true;',
      errors: [{ messageId: 'noBooleanReturnTrap', data: { name: 'validateUser' } }],
    },
    {
      name: 'should disallow Promise<boolean> non-predicate function',
      code: 'async function validateUser(): Promise<boolean> { return true; }',
      errors: [{ messageId: 'noBooleanReturnTrap', data: { name: 'validateUser' } }],
    },
  ],
});
