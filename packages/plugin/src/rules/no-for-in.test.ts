import { ruleTester } from '../testing/test-helper';
import { noForIn } from './no-for-in';

describe('no-for-in', () => {
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
        name: 'should report for-in statement without changing inherited key behavior',
        code: 'for (const key in obj) { console.log(key); }',
        errors: [{ messageId: 'noForIn' }],
        output: null,
      },
      {
        name: 'should report nested for-in statement without autofix',
        code: 'while (ready) { for (const key in obj) { use(key); } }',
        errors: [{ messageId: 'noForIn' }],
        output: null,
      },
      {
        name: 'should report assignment-left for-in statement without autofix',
        code: 'for (key in obj) process(key);',
        errors: [{ messageId: 'noForIn' }],
        output: null,
      },
      {
        name: 'should preserve loops that intentionally visit inherited enumerable keys',
        code: 'for (const key in Object.create({ inherited: 1 })) { use(key); }',
        errors: [{ messageId: 'noForIn' }],
        output: null,
      },
    ],
  });
});
