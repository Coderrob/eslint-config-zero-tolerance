import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noFloatingPromises } from './no-floating-promises';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-floating-promises', noFloatingPromises, {
  valid: [
    {
      name: 'should pass for void import expression',
      code: 'void import("./mod");',
    },
    {
      name: 'should pass for awaited import expression',
      code: 'async function run() { await import("./mod"); }',
    },
    {
      name: 'should pass for promise chain with catch handler',
      code: 'fetchData().catch(handleError);',
    },
    {
      name: 'should pass for promise chain with then rejection handler',
      code: 'fetchData().then(handleData, handleError);',
    },
    {
      name: 'should pass for promise chain ending in finally after catch',
      code: 'fetchData().catch(handleError).finally(cleanup);',
    },
    {
      name: 'should pass for regular synchronous expression statement',
      code: 'doWork();',
    },
    {
      name: 'should pass for unary non-void expression',
      code: '-Promise.resolve(1);',
    },
    {
      name: 'should pass for non-call expression statement',
      code: 'value;',
    },
  ],
  invalid: [
    {
      name: 'should error for unhandled import expression',
      code: 'import("./mod");',
      errors: [{ messageId: 'noFloatingPromises' }],
    },
    {
      name: 'should error for unhandled Promise constructor',
      code: 'new Promise((resolve) => resolve(1));',
      errors: [{ messageId: 'noFloatingPromises' }],
    },
    {
      name: 'should error for unhandled Promise static resolve',
      code: 'Promise.resolve(1);',
      errors: [{ messageId: 'noFloatingPromises' }],
    },
    {
      name: 'should error for unhandled async iife',
      code: '(async () => { await work(); })();',
      errors: [{ messageId: 'noFloatingPromises' }],
    },
    {
      name: 'should error for then chain without rejection handler',
      code: 'fetchData().then(handleData);',
      errors: [{ messageId: 'noFloatingPromises' }],
    },
    {
      name: 'should error for finally chain without rejection handler',
      code: 'fetchData().finally(cleanup);',
      errors: [{ messageId: 'noFloatingPromises' }],
    },
  ],
});
