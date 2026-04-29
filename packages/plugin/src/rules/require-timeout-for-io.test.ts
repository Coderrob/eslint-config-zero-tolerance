import { ruleTester } from '../testing/test-helper';
import { requireTimeoutForIo } from './require-timeout-for-io';

ruleTester.run('require-timeout-for-io', requireTimeoutForIo, {
  valid: [
    {
      name: 'should allow fetch with signal',
      code: 'fetch(url, { signal });',
    },
    {
      name: 'should allow axios with timeout',
      code: 'axios.get(url, { timeout: 5000 });',
    },
    {
      name: 'should allow subprocess with timeout',
      code: "spawn('git', ['status'], { timeout: 5000 });",
    },
    {
      name: 'should allow approved IO wrapper',
      code: 'fetchWithTimeout(url);',
      options: [{ approvedWrapperNames: ['fetchWithTimeout'] }],
    },
    {
      name: 'should skip test files by default',
      filename: 'src/http.test.ts',
      code: 'fetch(url);',
    },
    {
      name: 'should allow regex exec calls without timeout',
      code: 'const match = pattern.exec(value);',
    },
    {
      name: 'should allow superagent timeout chains',
      code: 'superagent.get(url).timeout(5000);',
    },
    {
      name: 'should allow dynamic calls without IO names',
      code: '(getClient())(url);',
    },
  ],
  invalid: [
    {
      name: 'should report bare fetch',
      code: 'fetch(url);',
      errors: [{ messageId: 'missingTimeout' }],
    },
    {
      name: 'should report axios without timeout',
      code: 'axios.get(url);',
      errors: [{ messageId: 'missingTimeout' }],
    },
    {
      name: 'should report direct axios without timeout',
      code: 'axios(url);',
      errors: [{ messageId: 'missingTimeout' }],
    },
    {
      name: 'should report got without timeout',
      code: 'got(url);',
      errors: [{ messageId: 'missingTimeout' }],
    },
    {
      name: 'should report spawn without timeout',
      code: "spawn('git', ['status']);",
      errors: [{ messageId: 'missingTimeout' }],
    },
    {
      name: 'should report configured IO function',
      code: 'readRemote(url);',
      options: [{ additionalIoFunctionNames: ['readRemote'] }],
      errors: [{ messageId: 'missingTimeout' }],
    },
    {
      name: 'should report test files when configured',
      filename: 'src/http.test.ts',
      code: 'fetch(url);',
      options: [{ checkTests: true }],
      errors: [{ messageId: 'missingTimeout' }],
    },
  ],
});
