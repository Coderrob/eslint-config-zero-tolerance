import process from 'node:process';
import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { ruleTester } from '../testing/test-helper';
import { noFloatingPromises } from './no-floating-promises';

const typeAwareRuleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      projectService: { allowDefaultProject: ['src/promise-contract.ts'] },
      tsconfigRootDir: process.cwd(),
    },
  },
});

describe('no-floating-promises', () => {
  typeAwareRuleTester.run('no-floating-promises with types', noFloatingPromises, {
    valid: [
      {
        name: 'should allow a typed synchronous call',
        filename: 'src/promise-contract.ts',
        code: 'declare function read(): number; read();',
      },
      {
        name: 'should allow a property named then that is not callable',
        filename: 'src/promise-contract.ts',
        code: 'declare function read(): { then: number }; read();',
      },
    ],
    invalid: [
      {
        name: 'should report an externally declared promise-producing call',
        filename: 'src/promise-contract.ts',
        code: 'declare function read(): Promise<number>; read();',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
      {
        name: 'should report a promise value used as an expression',
        filename: 'src/promise-contract.ts',
        code: 'declare const pending: Promise<void>; pending;',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
      {
        name: 'should report union return types that may contain a promise',
        filename: 'src/promise-contract.ts',
        code: 'declare function read(): Promise<number> | number; read();',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
    ],
  });
  ruleTester.run('no-floating-promises', noFloatingPromises, {
    valid: [
      {
        name: 'should allow a callback returning a fulfilled promise',
        code: 'Promise.resolve().catch(() => Promise.resolve());',
      },
      {
        name: 'should allow an ordinary callback expression',
        code: 'Promise.resolve().catch(() => recover());',
      },
      {
        name: 'should allow an empty callback return',
        code: 'Promise.resolve().catch(() => { return; });',
      },
      {
        name: 'should allow a callback with a conditional nonthrowing branch',
        code: 'Promise.resolve().catch(() => { if (recoverable) log(); });',
      },
      {
        name: 'should allow callback member references',
        code: 'Promise.resolve().catch(reporter.handle);',
      },
      {
        name: 'should allow generator callbacks whose body is not executed by the promise',
        code: 'Promise.resolve().catch(function* () { throw Error(); });',
      },
      {
        name: 'should allow async generator expressions assigned to variables',
        code: 'const run = async function* () { yield 1; }; run();',
      },
      {
        name: 'should ignore uninitialized or nonfunction variable declarations',
        code: 'let run; const other = fallback; function start() { if (run) run(); other(); }',
      },
      {
        name: 'should avoid inferring bindings through dynamic with scopes',
        code: 'with (object) { run(); }',
        languageOptions: {
          sourceType: 'script',
        },
      },

      {
        name: 'should allow void local async calls',
        code: 'async function run() {} void run();',
      },
      {
        name: 'should allow returned local async calls',
        code: 'async function run() {} function start() { return run(); }',
      },
      {
        name: 'should honor a synchronous parameter shadowing an async function',
        code: 'async function run() {} function start(run) { run(); }',
      },
      {
        name: 'should honor a synchronous variable shadowing an async function',
        code: 'async function run() {} function start() { const run = () => 1; run(); }',
      },
      {
        name: 'should not retain async bindings between files',
        code: 'run();',
      },
      {
        name: 'should allow async generator calls',
        code: 'async function* run() { yield 1; } run();',
      },
      {
        name: 'should allow async generator immediate calls',
        code: '(async function* () { yield 1; })();',
      },
      {
        name: 'should allow an overwritten function without assuming its return type',
        code: 'let run = async () => {}; run = () => 1; run();',
      },
      {
        name: 'should allow a nested function that throws without executing it',
        code: 'Promise.resolve().catch(() => { function nested() { throw Error(); } });',
      },

      {
        name: 'should allow void import expression',
        code: 'void import("./mod");',
      },
      {
        name: 'should allow awaited import expression',
        code: 'async function run() { await import("./mod"); }',
      },
      {
        name: 'should allow promise chain with catch handler',
        code: 'fetchData().catch(handleError);',
      },
      {
        name: 'should allow promise chain with then rejection handler',
        code: 'fetchData().then(handleData, handleError);',
      },
      {
        name: 'should allow regular synchronous expression statement',
        code: 'doWork();',
      },
      {
        name: 'should allow unary non-void expression',
        code: '-Promise.resolve(1);',
      },
      {
        name: 'should allow non-call expression statement',
        code: 'value;',
      },
    ],
    invalid: [
      {
        name: 'should resolve the internal name of an async function expression',
        code: 'const task = async function run() { run(); }; void task();',
        errors: [{ messageId: 'noFloatingPromises' }],
      },

      {
        name: 'should reject a callback that directly returns a rejected promise',
        code: 'Promise.resolve().catch(() => Promise.reject(Error()));',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject a block callback that returns a rejected promise',
        code: 'Promise.resolve().catch(() => { return Promise.reject(Error()); });',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject a callback whose alternate branch throws',
        code: 'Promise.resolve().catch(() => { if (recoverable) return; else throw Error(); });',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },

      {
        name: 'should report a local async declaration regardless of source order',
        code: 'run(); async function run() {}',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should report a local async arrow',
        code: 'const run = async () => {}; run();',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should report a local async function expression',
        code: 'const run = async function() {}; run();',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should resolve outer async bindings inside nested functions',
        code: 'async function run() {} function start() { run(); }',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should not treat an earlier catch as handling a later then rejection',
        code: 'Promise.resolve().catch(handleError).then(work);',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should report cleanup chained after catch without a terminal handler',
        code: 'Promise.resolve().catch(handleError).finally(cleanup);',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject a missing catch callback',
        code: 'Promise.reject().catch();',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject null catch callbacks',
        code: 'Promise.reject().catch(null);',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject undefined catch callbacks',
        code: 'Promise.reject().catch(undefined);',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject missing then rejection callbacks',
        code: 'Promise.reject().then(work, undefined);',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject an inline catch callback that rethrows',
        code: 'Promise.resolve().catch(() => { throw Error("boom"); });',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject an inline catch callback that conditionally rethrows',
        code: 'Promise.resolve().catch(() => { if (fatal) throw Error("boom"); });',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject an async rejection callback',
        code: 'Promise.resolve().catch(async () => {});',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },
      {
        name: 'should reject a fulfillment callback that visibly throws',
        code: 'Promise.resolve().then(() => { throw Error(); }, handleError);',
        errors: [
          {
            messageId: 'noFloatingPromises',
          },
        ],
      },

      {
        name: 'should report unhandled import expression',
        code: 'import("./mod");',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
      {
        name: 'should report unhandled Promise constructor',
        code: 'new Promise((resolve) => resolve(1));',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
      {
        name: 'should report unhandled Promise static resolve',
        code: 'Promise.resolve(1);',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
      {
        name: 'should report unhandled async iife',
        code: '(async () => { await work(); })();',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
      {
        name: 'should report then chain without rejection handler',
        code: 'fetchData().then(handleData);',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
      {
        name: 'should report finally chain without rejection handler',
        code: 'fetchData().finally(cleanup);',
        errors: [{ messageId: 'noFloatingPromises' }],
      },
    ],
  });
});
