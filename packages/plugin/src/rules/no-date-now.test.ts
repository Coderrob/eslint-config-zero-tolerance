import { ruleTester } from '../test-helper';
import { noDateNow } from './no-date-now';

ruleTester.run('no-date-now', noDateNow, {
  valid: [
    {
      name: 'should allow calling clock now method',
      code: 'const timestamp = clock.now();',
    },
    {
      name: 'should allow Date.now accessed as property without call',
      code: 'const nowRef = Date.now;',
    },
    {
      name: 'should allow Date computed property call',
      code: "const value = Date['now']();",
    },
    {
      name: 'should allow explicit date construction',
      code: 'const date = new Date(1700000000000);',
    },
    {
      name: 'should allow member-expression date construction',
      code: 'const date = new Clock.Date();',
    },
  ],
  invalid: [
    {
      name: 'should disallow Date.now call',
      code: 'const timestamp = Date.now();',
      errors: [{ messageId: 'noDateNow' }],
    },
    {
      name: 'should disallow no-arg Date construction',
      code: 'const date = new Date();',
      errors: [{ messageId: 'noNewDateNow' }],
    },
  ],
});
