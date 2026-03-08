import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { preferShortcutReturn } from './prefer-shortcut-return';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('prefer-shortcut-return', preferShortcutReturn, {
  valid: [
    {
      name: 'should allow already short boolean return expression',
      code: 'function f(cond: unknown) { return !!(cond); }',
    },
    {
      name: 'should allow if statements that return non-boolean values',
      code: 'function f(cond: boolean) { if (cond) return 1; return 0; }',
    },
    {
      name: 'should allow else-if chains',
      code: 'function f(a: boolean, b: boolean) { if (a) return true; else if (b) return false; return true; }',
    },
    {
      name: 'should allow block consequents with extra statements',
      code: 'function f(cond: boolean) { if (cond) { log(); return true; } return false; }',
    },
    {
      name: 'should allow if-return pattern when both branches return true',
      code: 'function f(cond: boolean) { if (cond) return true; return true; }',
    },
    {
      name: 'should allow if branch returning identifier instead of boolean literal',
      code: 'function f(cond: boolean, result: boolean) { if (cond) return result; return false; }',
    },
  ],
  invalid: [
    {
      name: 'should replace if then return true false with shortcut return',
      code: 'function f(cond: unknown) { if (cond) return true; return false; }',
      output: 'function f(cond: unknown) { return !!(cond); }',
      errors: [{ messageId: 'preferShortcutReturn' }],
    },
    {
      name: 'should replace if else return false true with negated shortcut',
      code: 'function f(cond: unknown) { if (cond) { return false; } else { return true; } }',
      output: 'function f(cond: unknown) { return !(cond); }',
      errors: [{ messageId: 'preferShortcutReturn' }],
    },
    {
      name: 'should replace if else return true false with shortcut return',
      code: 'function f(cond: unknown) { if (cond) { return true; } else { return false; } }',
      output: 'function f(cond: unknown) { return !!(cond); }',
      errors: [{ messageId: 'preferShortcutReturn' }],
    },
  ],
});
