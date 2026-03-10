import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noLabels } from './no-labels';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-labels', noLabels, {
  valid: [
    {
      name: 'should allow plain loop without labels',
      code: 'for (const value of values) { if (!value) { break; } }',
    },
    {
      name: 'should allow function declaration',
      code: 'function run(): void { return; }',
    },
  ],
  invalid: [
    {
      name: 'should report simple label usage',
      code: 'outer: for (const value of values) { break outer; }',
      errors: [{ messageId: 'noLabels' }],
    },
    {
      name: 'should report nested label usage',
      code: 'labelOne: { labelTwo: for (const item of items) { break labelTwo; } }',
      errors: [{ messageId: 'noLabels' }, { messageId: 'noLabels' }],
    },
  ],
});
