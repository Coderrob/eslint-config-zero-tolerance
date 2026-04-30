import { ruleTester } from '../testing/test-helper';
import { noUnsafeJsonParse } from './no-unsafe-json-parse';

ruleTester.run('no-unsafe-json-parse', noUnsafeJsonParse, {
  valid: [
    {
      name: 'should allow JSON parse assigned to unknown',
      code: 'const value: unknown = JSON.parse(input);',
    },
    {
      name: 'should allow schema parse validation',
      code: 'const config = ConfigSchema.parse(JSON.parse(input));',
    },
    {
      name: 'should allow configured safe wrapper calls',
      code: 'const config = safeJsonParse<Config>(input);',
    },
    {
      name: 'should allow untyped JSON parse variables',
      code: 'const config = JSON.parse(input);',
    },
    {
      name: 'should allow nested JSON parse expressions without assertion',
      code: 'use(JSON.parse(input));',
    },
    {
      name: 'should allow assertions around non JSON parse calls',
      code: 'const config = parse(input) as Config;',
    },
    {
      name: 'should allow configured validator option syntax',
      code: 'const config = parse(JSON.parse(input));',
      options: [{ validatorNames: ['parse'] }],
    },
    {
      name: 'should allow non JSON parse assertions',
      code: 'const config = value as Config;',
    },
  ],
  invalid: [
    {
      name: 'should report as assertion on JSON parse',
      code: 'const config = JSON.parse(input) as Config;',
      errors: [
        {
          messageId: 'unsafeJsonParse',
          suggestions: [
            {
              messageId: 'parseAsUnknown',
              output: 'const config: unknown = JSON.parse(input);',
            },
          ],
        },
      ],
    },
    {
      name: 'should report angle assertion on JSON parse',
      code: 'const config = <Config>JSON.parse(input);',
      errors: [{ messageId: 'unsafeJsonParse' }],
    },
    {
      name: 'should report typed variable JSON parse',
      code: 'const config: Config = JSON.parse(input);',
      errors: [
        {
          messageId: 'unsafeJsonParse',
          suggestions: [
            {
              messageId: 'parseAsUnknown',
              output: 'const config: unknown = JSON.parse(input);',
            },
          ],
        },
      ],
    },
    {
      name: 'should report typed return assertion',
      code: 'function load(): Config { return JSON.parse(input) as Config; }',
      errors: [{ messageId: 'unsafeJsonParse' }],
    },
    {
      name: 'should report non variable assertion without suggestions',
      code: 'use(JSON.parse(input) as Config);',
      errors: [{ messageId: 'unsafeJsonParse', suggestions: [] }],
    },
  ],
});
