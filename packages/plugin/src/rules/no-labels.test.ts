import { ruleTester } from '../testing/test-helper';
import { noLabels } from './no-labels';

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
