import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { preferGuardClauses } from './prefer-guard-clauses';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('prefer-guard-clauses', preferGuardClauses, {
  valid: [
    {
      name: 'should allow if without else',
      code: 'if (!ok) return; doWork();',
    },
    {
      name: 'should allow if else when consequent does not terminate',
      code: 'if (ok) { doA(); } else { doB(); }',
    },
    {
      name: 'should allow else-if chains',
      code: 'if (a) { doA(); } else if (b) { return 2; }',
    },
  ],
  invalid: [
    {
      name: 'should disallow else after return in block consequent',
      code: 'function f(ok: boolean) { if (!ok) { return; } else { doWork(); } }',
      errors: [{ messageId: 'preferGuardClauses' }],
    },
    {
      name: 'should disallow else after throw in single consequent statement',
      code: 'function f(x: number) { if (x < 0) throw new Error("bad"); else return x; }',
      errors: [{ messageId: 'preferGuardClauses' }],
    },
  ],
});
