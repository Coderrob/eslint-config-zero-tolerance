import { ruleTester } from '../testing/test-helper';
import { noAwaitInLoop } from './no-await-in-loop';

const TOP_LEVEL_AWAIT_ECMA_VERSION = 2022;

describe('no-await-in-loop', () => {
  ruleTester.run('no-await-in-loop', noAwaitInLoop, {
    valid: [
      {
        name: 'should allow nested loops within an opted-in async iterator body',
        code: 'async function run() { for await (const item of stream) { while (more) { await work(); } } }',
        options: [{ allowForAwaitOf: true }],
      },
      {
        name: 'should allow asserted awaits outside loops',
        code: 'async function run() { await (work() as Promise<void>); }',
      },
      {
        name: 'should allow optional calls in configured retry',
        code: 'async function retry() { while (more) { await work?.(); } }',
        options: [{ allowedFunctionNames: ['retry'] }],
      },
      {
        name: 'should keep function boundaries inside loop headers',
        code: 'async function run() { while (factory(async () => { await work(); })) {} }',
      },
      {
        name: 'should allow configured retry function',
        code: 'async function retry() { while (true) { await attempt(); } }',
        options: [{ allowedFunctionNames: ['retry'] }],
      },
      {
        name: 'should allow configured arrow binding',
        code: 'const paginate = async () => { while (more) { await page(); } };',
        options: [{ allowedFunctionNames: ['paginate'] }],
      },
      {
        name: 'should allow named function expression',
        code: 'const task = async function retry() { while (true) { await attempt(); } };',
        options: [{ allowedFunctionNames: ['retry'] }],
      },
      {
        name: 'should allow async iterator work when configured',
        code: 'async function run() { for await (const x of stream) { await consume(x); } }',
        options: [{ allowForAwaitOf: true }],
      },
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
          ecmaVersion: TOP_LEVEL_AWAIT_ECMA_VERSION,
          sourceType: 'module',
        },
      },
    ],
    invalid: [
      {
        name: 'should report cast await within loop',
        code: 'async function run() { while (more) { await (work() as Promise<void>); } }',
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
      {
        name: 'should report optional awaited loop call',
        code: 'async function run() { for (const item of list) { await work?.(item); } }',
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
      {
        name: 'should avoid inheriting an allowed outer name',
        code: 'async function retry() { const worker = async () => { while (more) { await work(); } }; }',
        options: [{ allowedFunctionNames: ['retry'] }],
        errors: [{ messageId: 'noAwaitInLoop' }],
      },

      {
        name: 'should check anonymous callbacks',
        code: 'run(async function () { while (more) { await work(); } });',
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
      {
        name: 'should check anonymous arrows',
        code: 'run(async () => { while (more) { await work(); } });',
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
      {
        name: 'should check destructured arrow bindings',
        code: 'const { run } = async () => { while (more) { await work(); } };',
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
      {
        name: 'should keep unrelated loops checked',
        code: 'async function run() { for (const x of list) { await work(x); } }',
        options: [{ allowedFunctionNames: ['retry'] }],
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
      {
        name: 'should keep async iterator bodies checked by default',
        code: 'async function run() { for await (const x of stream) { await consume(x); } }',
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
      {
        name: 'should keep top-level loops checked',
        code: 'for (const x of items) { await consume(x); }',
        errors: [{ messageId: 'noAwaitInLoop' }],
      },
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
});
