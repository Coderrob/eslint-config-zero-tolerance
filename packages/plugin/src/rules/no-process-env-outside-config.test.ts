import { ruleTester } from '../testing/test-helper';
import { noProcessEnvOutsideConfig } from './no-process-env-outside-config';

ruleTester.run('no-process-env-outside-config', noProcessEnvOutsideConfig, {
  valid: [
    {
      name: 'should allow process env in config files',
      filename: 'src/config.ts',
      code: 'const mode = process.env.NODE_ENV;',
    },
    {
      name: 'should allow process env in config directories',
      filename: 'src/config/index.ts',
      code: 'const mode = process.env.NODE_ENV;',
    },
    {
      name: 'should allow process env in tool config files',
      filename: 'vite.config.ts',
      code: 'const mode = process.env.NODE_ENV;',
    },
    {
      name: 'should allow non process env access',
      filename: 'src/app.ts',
      code: 'const mode = runtime.env.MODE;',
    },
  ],
  invalid: [
    {
      name: 'should disallow process env property reads in app code',
      filename: 'src/app.ts',
      code: 'const mode = process.env.NODE_ENV;',
      errors: [{ messageId: 'noProcessEnvOutsideConfig' }],
    },
    {
      name: 'should disallow destructuring from process env outside config',
      filename: 'src/app.ts',
      code: 'const { NODE_ENV } = process.env;',
      errors: [{ messageId: 'noProcessEnvOutsideConfig' }],
    },
    {
      name: 'should disallow computed process env reads outside config',
      filename: 'src/app.ts',
      code: 'const env = process["env"];',
      errors: [{ messageId: 'noProcessEnvOutsideConfig' }],
    },
  ],
});
