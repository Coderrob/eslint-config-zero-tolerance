import { ruleTester } from '../testing/test-helper';
import { noSetIntervalInTests } from './no-set-interval-in-tests';

ruleTester.run('no-set-interval-in-tests', noSetIntervalInTests, {
  valid: [
    {
      name: 'should allow setInterval outside test files',
      code: 'setInterval(callback, 100);',
      filename: 'src/scheduler.ts',
    },
    {
      name: 'should allow object setInterval methods in test files',
      code: 'clock.setInterval(callback, 100);',
      filename: 'src/scheduler.test.ts',
    },
    {
      name: 'should allow setInterval property references in test files',
      code: 'const timer = setInterval;',
      filename: 'src/scheduler.test.ts',
    },
    {
      name: 'should allow unresolved computed setInterval calls in test files',
      code: 'globalThis[methodName](callback, 100);',
      filename: 'src/scheduler.test.ts',
    },
  ],
  invalid: [
    {
      name: 'should disallow direct setInterval calls in test files',
      code: 'setInterval(callback, 100);',
      filename: 'src/scheduler.test.ts',
      errors: [{ messageId: 'noSetIntervalInTests' }],
    },
    {
      name: 'should disallow global setInterval calls in test files',
      code: 'global.setInterval(callback, 100);',
      filename: 'src/scheduler.spec.ts',
      errors: [{ messageId: 'noSetIntervalInTests' }],
    },
    {
      name: 'should disallow window setInterval calls in test files',
      code: 'window.setInterval(callback, 100);',
      filename: 'src/__tests__/scheduler.ts',
      errors: [{ messageId: 'noSetIntervalInTests' }],
    },
    {
      name: 'should disallow self setInterval calls in integration test files',
      code: 'self.setInterval(callback, 100);',
      filename: 'src/scheduler.integration.ts',
      errors: [{ messageId: 'noSetIntervalInTests' }],
    },
    {
      name: 'should disallow computed string setInterval calls in test files',
      code: "globalThis['setInterval'](callback, 100);",
      filename: 'src/scheduler.test.ts',
      errors: [{ messageId: 'noSetIntervalInTests' }],
    },
  ],
});
