import { ruleTester } from '../test-helper';
import { noAwaitInLoop } from './no-await-in-loop';

ruleTester.run('no-await-in-loop', noAwaitInLoop, {
  valid: [
    {
      name: 'should allow await outside loop',
      code: 'async function main() { await fetch(url); }',
    },
    {
      name: 'should allow Promise.all usage',
      code: 'async function main() { const results = await Promise.all(items.map(x => process(x))); }',
    },
    {
      name: 'should allow await inside nested async function within loop',
      code: 'async function main() { for (const x of items) { const fn = async () => { await process(x); }; fn(); } }',
    },
    {
      name: 'should allow await in nested async function inside while loop',
      code: 'async function main() { while (true) { const fn = async () => await work(); } }',
    },
    {
      name: 'should allow Promise.allSettled usage',
      code: 'async function main() { await Promise.allSettled(items.map(x => process(x))); }',
    },
    {
      name: 'should allow top-level await outside any loop',
      code: 'await fetch(url);',
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  ],
  invalid: [
    {
      name: 'should report await in for-of loop',
      code: 'async function main() { for (const x of items) { await process(x); } }',
      errors: [{ messageId: 'noAwaitInLoop' }],
    },
    {
      name: 'should report await in for loop',
      code: 'async function main() { for (let i = 0; i < 10; i++) { await step(i); } }',
      errors: [{ messageId: 'noAwaitInLoop' }],
    },
    {
      name: 'should report await in while loop',
      code: 'async function main() { while (condition()) { await poll(); } }',
      errors: [{ messageId: 'noAwaitInLoop' }],
    },
    {
      name: 'should report await in do-while loop',
      code: 'async function main() { do { await tick(); } while (running); }',
      errors: [{ messageId: 'noAwaitInLoop' }],
    },
    {
      name: 'should report await in for-in loop',
      code: 'async function main() { for (const k in obj) { await handle(k); } }',
      errors: [{ messageId: 'noAwaitInLoop' }],
    },
  ],
});
