import { ruleTester } from '../testing/test-helper';
import { noConditionalTestAssertion } from './no-conditional-test-assertion';

describe('no-conditional-test-assertion', () => {
  ruleTester.run('no-conditional-test-assertion', noConditionalTestAssertion, {
    valid: [
      {
        name: 'should allow an unconditional assertion in a do while body',
        code: 'do { expect(actual).toBe(expected); } while (false);',
        filename: 'example.test.ts',
      },
      {
        name: 'should allow imported assert in a do while body',
        code: 'import assert from "node:assert/strict"; do { assert.equal(actual, expected); } while (pending);',
        filename: 'example.test.ts',
      },
      {
        name: 'should allow conditional test data with an unconditional assertion',
        filename: 'example.test.ts',
        code: 'const actual = condition ? first : second; if (condition) prepare(); expect(actual).toBe(expected);',
      },
      {
        name: 'should allow an expect call without an assertion matcher',
        filename: 'example.test.ts',
        code: 'if (condition) { const pending = expect(value); }',
      },
      {
        name: 'should allow assertions in loops over fixed nonempty arrays',
        filename: 'example.test.ts',
        code: 'for (const value of [1, 2]) { expect(value).toBeDefined(); } for (const value of [...items, 1]) { expect(value).toBeDefined(); }',
      },
      {
        name: 'should allow an assertion in a separately declared callback',
        filename: 'example.test.ts',
        code: 'if (condition) { const verify = () => expect(value).toBe(expected); }',
      },
      {
        name: 'should allow assertion methods from unrelated packages',
        filename: 'example.test.ts',
        code: 'import { expect as check } from "other"; if (condition) check(value).toBe(expected); import { assert } from "other"; if (condition) assert.equal(value, expected);',
      },
      {
        name: 'should allow a shadowed expect binding',
        filename: 'example.test.ts',
        code: 'function verify(expect) { if (condition) expect(value).toBe(expected); }',
      },
      {
        name: 'should allow unrelated destructured expect parameters',
        filename: 'example.test.ts',
        code: 'function verify({ expect }) { if (condition) expect(value).toBe(expected); } import { test as otherTest } from "other"; otherTest("should check", ({ expect }) => { if (condition) expect(value).toBe(expected); });',
      },
      {
        name: 'should ignore conditional assertions outside test files',
        filename: 'src/example.ts',
        code: 'if (condition) expect(value).toBe(expected);',
      },
    ],
    invalid: [
      {
        name: 'should report conditional branches within a do while body',
        code: 'do { if (condition) expect(actual).toBe(expected); } while (false);',
        filename: 'example.test.ts',
        errors: [{ messageId: 'conditionalTestAssertion' }],
      },
      {
        name: 'should report a do while assertion inside a skippable outer loop',
        code: 'while (pending) { do { expect(actual).toBe(expected); } while (false); }',
        filename: 'example.test.ts',
        errors: [{ messageId: 'conditionalTestAssertion' }],
      },
      {
        name: 'should report short circuit assertions in a do while body',
        code: 'do { condition && expect(actual).toBe(expected); } while (false);',
        filename: 'example.test.ts',
        errors: [{ messageId: 'conditionalTestAssertion' }],
      },
      {
        name: 'should report assertions inside if and else branches',
        filename: 'example.test.ts',
        code: 'if (condition) { expect(actual).toBe(expected); } else { expect(actual).toBe(other); }',
        errors: [
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
        ],
      },
      {
        name: 'should report short-circuit and ternary assertions',
        filename: 'example.spec.ts',
        code: 'condition && expect(value).toBe(1); condition ? expect(value).toBe(1) : fallback();',
        errors: [
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
        ],
      },
      {
        name: 'should report assertions inside catch and promise catch callbacks',
        filename: 'example.test.ts',
        code: 'try { load(); } catch (error) { expect(error).toBeDefined(); } load().catch(error => expect(error).toBeDefined());',
        errors: [
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
        ],
      },
      {
        name: 'should report assertions in switch cases and loop bodies',
        filename: 'example.test.ts',
        code: 'switch (value) { case 1: expect(value).toBe(1); break; } for (const item of items) { expect(item).toBe(1); }',
        errors: [
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
        ],
      },
      {
        name: 'should report Vitest soft and Chai expect aliases across formatting variations',
        filename: 'example.test.ts',
        code: 'import { expect as check } from "vitest"; import { expect as chaiCheck } from "chai"; if (condition) { (check["soft"])(value) /* comment */ ["toBe"](1); chaiCheck(value).to.equal(1); }',
        errors: [
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
        ],
      },
      {
        name: 'should report local Vitest expect assertions inside branches',
        filename: 'example.test.ts',
        code: 'import { test as verify } from "vitest"; verify("should check", ({ expect: check }) => { if (condition) check(value).toBe(1); });',
        errors: [{ messageId: 'conditionalTestAssertion' }],
      },
      {
        name: 'should report computed local expect properties in global Vitest tests',
        filename: 'example.test.ts',
        code: 'test("should check", ({ ["expect"]: check }) => { if (condition) check(value).toBe(1); });',
        errors: [{ messageId: 'conditionalTestAssertion' }],
      },
      {
        name: 'should report Chai and Sinon assert calls in conditional branches',
        filename: 'example.integration.ts',
        code: 'import { assert as chaiAssert } from "chai"; import * as sinon from "sinon"; import { assert as vitestAssert } from "vitest"; if (condition) { chaiAssert.equal(value, 1); sinon["assert"].called(spy); vitestAssert.equal(value, 1); }',
        errors: [
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
        ],
      },
      {
        name: 'should report computed global expect calls in a conditional branch',
        filename: 'example.test.ts',
        code: 'if (condition) globalThis["expect"](value)?.["toBe"]?.(1);',
        errors: [{ messageId: 'conditionalTestAssertion' }],
      },
      {
        name: 'should report Node assert imports in Mocha test branches',
        filename: 'example.test.ts',
        code: 'import assert from "node:assert/strict"; import { strict as check } from "node:assert"; import * as nodeAssert from "assert"; if (condition) { assert.equal(actual, expected); check(actual); nodeAssert["deepEqual"](actual, expected); }',
        errors: [
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
          { messageId: 'conditionalTestAssertion' },
        ],
      },
    ],
  });
});
