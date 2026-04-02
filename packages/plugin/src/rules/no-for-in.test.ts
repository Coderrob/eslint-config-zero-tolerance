import { ruleTester } from '../testing/test-helper';
import { noForIn } from './no-for-in';

ruleTester.run('no-for-in', noForIn, {
  valid: [
    {
      name: 'should allow for-of loop',
      code: 'for (const value of values) { console.log(value); }',
    },
    {
      name: 'should allow Object.keys iteration',
      code: 'for (const key of Object.keys(obj)) { console.log(key); }',
    },
    {
      name: 'should allow Object.entries iteration',
      code: 'for (const [key, value] of Object.entries(obj)) { console.log(key, value); }',
    },
  ],
  invalid: [
    {
      name: 'should report and autofix for-in statement',
      code: 'for (const key in obj) { console.log(key); }',
      errors: [{ messageId: 'noForIn' }],
      output: 'for (const key of Object.keys(obj)) { console.log(key); }',
    },
    {
      name: 'should report and autofix nested for-in statement',
      code: 'while (ready) { for (const key in obj) { use(key); } }',
      errors: [{ messageId: 'noForIn' }],
      output: 'while (ready) { for (const key of Object.keys(obj)) { use(key); } }',
    },
    {
      name: 'should report and autofix assignment-left for-in statement',
      code: 'for (key in obj) process(key);',
      errors: [{ messageId: 'noForIn' }],
      output: 'for (key of Object.keys(obj)) process(key);',
    },
  ],
});
