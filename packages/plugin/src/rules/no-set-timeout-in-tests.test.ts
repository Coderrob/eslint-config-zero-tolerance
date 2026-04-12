import { ruleTester } from '../testing/test-helper';
import { noSetTimeoutInTests } from './no-set-timeout-in-tests';

ruleTester.run('no-set-timeout-in-tests', noSetTimeoutInTests, {
  valid: [
    {
      name: 'should allow setTimeout outside test files',
      code: 'setTimeout(callback, 100);',
      filename: 'src/scheduler.ts',
    },
    {
      name: 'should allow object setTimeout methods in test files',
      code: 'clock.setTimeout(callback, 100);',
      filename: 'src/scheduler.test.ts',
    },
    {
      name: 'should allow setTimeout property references in test files',
      code: 'const timer = setTimeout;',
      filename: 'src/scheduler.test.ts',
    },
    {
      name: 'should allow unresolved computed setTimeout calls in test files',
      code: 'globalThis[methodName](callback, 100);',
      filename: 'src/scheduler.test.ts',
    },
  ],
  invalid: [
    {
      name: 'should disallow direct setTimeout calls in test files',
      code: 'setTimeout(callback, 100);',
      filename: 'src/scheduler.test.ts',
      errors: [{ messageId: 'noSetTimeoutInTests' }],
    },
    {
      name: 'should disallow globalThis setTimeout calls in test files',
      code: 'globalThis.setTimeout(callback, 100);',
      filename: 'src/scheduler.spec.ts',
      errors: [{ messageId: 'noSetTimeoutInTests' }],
    },
    {
      name: 'should disallow window setTimeout calls in test files',
      code: 'window.setTimeout(callback, 100);',
      filename: 'src/__tests__/scheduler.ts',
      errors: [{ messageId: 'noSetTimeoutInTests' }],
    },
    {
      name: 'should disallow self setTimeout calls in e2e test files',
      code: 'self.setTimeout(callback, 100);',
      filename: 'src/scheduler.e2e.ts',
      errors: [{ messageId: 'noSetTimeoutInTests' }],
    },
    {
      name: 'should disallow computed string setTimeout calls in test files',
      code: "globalThis['setTimeout'](callback, 100);",
      filename: 'src/scheduler.test.ts',
      errors: [{ messageId: 'noSetTimeoutInTests' }],
    },
  ],
});
