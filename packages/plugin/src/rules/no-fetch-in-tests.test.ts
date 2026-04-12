import { ruleTester } from '../testing/test-helper';
import { noFetchInTests } from './no-fetch-in-tests';

ruleTester.run('no-fetch-in-tests', noFetchInTests, {
  valid: [
    {
      name: 'should allow fetch outside test files',
      code: 'await fetch(url);',
      filename: 'src/client.ts',
    },
    {
      name: 'should allow object fetch methods in test files',
      code: 'client.fetch(url);',
      filename: 'src/client.test.ts',
    },
    {
      name: 'should allow fetch property references in test files',
      code: 'const request = fetch;',
      filename: 'src/client.test.ts',
    },
    {
      name: 'should allow unresolved computed fetch calls in test files',
      code: 'globalThis[methodName](url);',
      filename: 'src/client.test.ts',
    },
  ],
  invalid: [
    {
      name: 'should disallow direct fetch calls in test files',
      code: 'await fetch(url);',
      filename: 'src/client.test.ts',
      errors: [{ messageId: 'noFetchInTests' }],
    },
    {
      name: 'should disallow globalThis fetch calls in test files',
      code: 'await globalThis.fetch(url);',
      filename: 'src/client.spec.ts',
      errors: [{ messageId: 'noFetchInTests' }],
    },
    {
      name: 'should disallow window fetch calls in test files',
      code: 'await window.fetch(url);',
      filename: 'src/__tests__/client.ts',
      errors: [{ messageId: 'noFetchInTests' }],
    },
    {
      name: 'should disallow self fetch calls in e2e test files',
      code: 'await self.fetch(url);',
      filename: 'src/client.e2e.ts',
      errors: [{ messageId: 'noFetchInTests' }],
    },
    {
      name: 'should disallow computed string fetch calls in test files',
      code: "await globalThis['fetch'](url);",
      filename: 'src/client.test.ts',
      errors: [{ messageId: 'noFetchInTests' }],
    },
  ],
});
