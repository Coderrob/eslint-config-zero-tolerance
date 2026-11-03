import { ruleTester } from '../testing/test-helper';
import { noUnawaitedAsyncAssertion } from './no-unawaited-async-assertion';

describe('no-unawaited-async-assertion', () => {
  ruleTester.run('no-unawaited-async-assertion', noUnawaitedAsyncAssertion, {
    valid: [
      {
        name: 'should allow awaited and returned Jest assertions',
        filename: 'example.test.ts',
        code: 'async function check() { await expect(promise).resolves.toBe(1); } function verify() { return expect(promise).rejects.toThrow(); }',
      },
      {
        name: 'should allow async assertions stored for later awaiting',
        filename: 'example.spec.ts',
        code: 'async function check() { const assertion = expect(promise).resolves.toBe(1); await assertion; }',
      },
      {
        name: 'should allow awaited Vitest polling and soft assertions',
        filename: 'example.test.ts',
        code: 'import { expect as check } from "vitest"; async function verify() { await check.poll(() => value).toBe(1); await check.element(locator).toBeVisible(); await check.soft(promise).rejects.toThrow(); }',
      },
      {
        name: 'should allow awaited local Vitest expect assertions',
        filename: 'example.test.ts',
        code: 'import { test } from "vitest"; test("should resolve", async ({ expect: check }) => { await check(promise).resolves.toBe(1); });',
      },
      {
        name: 'should allow Chai completion callbacks and returned promises',
        filename: 'example.test.ts',
        code: 'import { expect } from "chai"; function verify(done) { expect(promise).to.eventually.equal(1).notify(done); } function check() { return expect(promise).to.be.rejected; }',
      },
      {
        name: 'should allow synchronous assertions and bare modifier property reads',
        filename: 'example.test.ts',
        code: 'expect(value).toBe(1); expect(promise).resolves; expect.poll(() => value); import { expect as chaiExpect } from "chai"; chaiExpect(value).to.equal(1); import { expect as check } from "vitest"; check.soft(value).toBe(1);',
      },
      {
        name: 'should ignore dynamic properties and ordinary calls',
        filename: 'example.test.ts',
        code: 'work(); expect(promise)[modifier].toBe(1); expect(promise)[property]; expect[method](value).toBe(1); import { assert } from "chai"; assert.equal(value, 1);',
      },
      {
        name: 'should ignore shadowed or unrelated expect bindings',
        filename: 'example.test.ts',
        code: 'import { expect as check } from "other"; check(promise).resolves.toBe(1); function verify(expect) { expect(promise).rejects.toThrow(); }',
      },
      {
        name: 'should ignore assertions outside test files',
        filename: 'src/example.ts',
        code: 'expect(promise).resolves.toBe(1);',
      },
    ],
    invalid: [
      {
        name: 'should report discarded global Jest promise assertions',
        filename: 'example.test.ts',
        code: 'expect(promise).resolves.toBe(1); globalThis.expect(promise)["rejects"]["toThrow"]();',
        errors: [
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
        ],
      },
      {
        name: 'should report imported Jest aliases with comments and void discards',
        filename: 'example.spec.ts',
        code: 'import { expect as check } from "@jest/globals";\nvoid (check)(promise)\n  /* async modifier */ ["resolves"]\n  ?.["toBe"]?.(1);',
        errors: [{ messageId: 'unawaitedAsyncAssertion' }],
      },
      {
        name: 'should report Vitest soft and polling assertions',
        filename: 'example.test.ts',
        code: 'import { expect as check } from "vitest"; check.soft(promise).rejects.toThrow(); check["poll"](() => value).toBe(1); expect.element(locator).toBeVisible();',
        errors: [
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
        ],
      },
      {
        name: 'should report local Vitest expect in a test callback',
        filename: 'example.test.ts',
        code: 'import { test as verify } from "vitest"; verify("should resolve", ({ expect: check }) => { check(promise).resolves.toBe(1); check.soft(promise).rejects.toThrow(); });',
        errors: [
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
        ],
      },
      {
        name: 'should report local Vitest expect in a function callback',
        filename: 'example.test.ts',
        code: 'import { it as verify } from "vitest"; verify("should resolve", function ({ expect }) { expect(promise).resolves.toBe(1); });',
        errors: [{ messageId: 'unawaitedAsyncAssertion' }],
      },
      {
        name: 'should report asynchronous Chai assert methods and eventually chains',
        filename: 'example.test.ts',
        code: 'import { assert as check } from "chai"; import * as chai from "chai"; check.isRejected(promise); check["isFulfilled"](promise); check.becomes(promise, 1); check.doesNotBecome(promise, 2); chai.assert.eventually.equal(promise, 1);',
        errors: [
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
        ],
      },
      {
        name: 'should report Chai promise methods and terminal properties',
        filename: 'example.test.ts',
        code: 'import * as chai from "chai"; chai.expect(promise).to.eventually.equal(1); chai.expect(promise).to.be.rejected; chai.expect(promise).to.be.fulfilled; chai.expect(promise).to.eventually.be.true;',
        errors: [
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
        ],
      },
      {
        name: 'should report Chai rejectedWith and become assertions',
        filename: 'example.integration.ts',
        code: 'import { expect } from "chai"; expect(promise).to.be.rejectedWith(Error); expect(promise).to.become(1);',
        errors: [
          { messageId: 'unawaitedAsyncAssertion' },
          { messageId: 'unawaitedAsyncAssertion' },
        ],
      },
      {
        name: 'should report discarded nested promise chains',
        filename: 'example.test.ts',
        code: 'expect(promise).resolves.toBe(1).then(onSuccess).catch(onFailure);',
        errors: [{ messageId: 'unawaitedAsyncAssertion' }],
      },
    ],
  });
});
