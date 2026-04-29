import { ruleTester } from '../testing/test-helper';
import { noHardcodedSecrets } from './no-hardcoded-secrets';

ruleTester.run('no-hardcoded-secrets', noHardcodedSecrets, {
  valid: [
    {
      name: 'should allow env variable reads without literal fallback',
      code: 'const token = process.env.API_TOKEN;',
    },
    {
      name: 'should allow dummy fixture secrets by default',
      code: "const token = 'dummy-secret-token-value';",
    },
    {
      name: 'should allow short sensitive literals',
      code: "const password = 'short';",
    },
    {
      name: 'should allow non secret strings',
      code: "const label = 'production database';",
    },
    {
      name: 'should allow ESLint rule message strings with sensitive message ids',
      code: "const rule = { meta: { messages: { hardcodedSecret: 'Hardcoded secrets or credentials are not allowed.' } } };",
    },
    {
      name: 'should allow computed object keys with long strings',
      code: "const value = { [name]: '12345678901234567890' };",
    },
    {
      name: 'should skip test files by default',
      filename: 'src/auth.test.ts',
      code: "const token = 'sk_live_12345678901234567890';",
    },
  ],
  invalid: [
    {
      name: 'should report API key prefixes',
      code: "const key = 'sk_live_12345678901234567890';",
      errors: [{ messageId: 'hardcodedSecret' }],
    },
    {
      name: 'should report JWT shaped tokens',
      code: "const jwt = 'aaaaaaaaaa.bbbbbbbbbb.cccccccccc';",
      errors: [{ messageId: 'hardcodedSecret' }],
    },
    {
      name: 'should report credential connection strings',
      code: "const url = 'postgres://user:password@database.internal/db';",
      errors: [{ messageId: 'hardcodedSecret' }],
    },
    {
      name: 'should report secret env fallback',
      code: "const token = process.env.API_TOKEN ?? '12345678901234567890';",
      errors: [{ messageId: 'hardcodedSecret' }],
    },
    {
      name: 'should report sensitive variable names',
      code: "const clientSecret = '12345678901234567890';",
      errors: [{ messageId: 'hardcodedSecret' }],
    },
    {
      name: 'should report sensitive object property names',
      code: "const config = { clientSecret: '12345678901234567890' };",
      errors: [{ messageId: 'hardcodedSecret' }],
    },
    {
      name: 'should report test files when configured',
      filename: 'src/auth.test.ts',
      code: "const token = 'sk_live_12345678901234567890';",
      options: [{ checkTests: true }],
      errors: [{ messageId: 'hardcodedSecret' }],
    },
  ],
});
