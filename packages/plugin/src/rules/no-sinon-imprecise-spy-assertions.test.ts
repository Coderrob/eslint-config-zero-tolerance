import { ruleTester } from '../testing/test-helper';
import { noSinonImpreciseSpyAssertions } from './no-sinon-imprecise-spy-assertions';

describe('no-sinon-imprecise-spy-assertions', () => {
  ruleTester.run('no-sinon-imprecise-spy-assertions', noSinonImpreciseSpyAssertions, {
    valid: [
      {
        name: 'should allow exact call counts',
        code: 'import sinon from "sinon"; sinon.assert.callCount(spy, 2); sinon.assert.calledOnce(spy);',
      },
      {
        name: 'should allow zero-call assertions',
        code: 'import * as sinon from "sinon"; sinon.assert.notCalled(spy);',
      },
      {
        name: 'should allow numbered-call argument assertions',
        code: 'import { assert } from "sinon"; assert.calledWithExactly(spy.getCall(0), "a");',
      },
      {
        name: 'should allow parenthesized computed indexed-call assertions',
        code: 'import { assert as check } from "sinon";\n(check)?.["calledWithExactly"]?.((spy["getCall"])(0), "a");',
      },
      {
        name: 'should allow exact single-call arguments',
        code: 'import { assert } from "sinon"; assert.calledOnceWithExactly(spy, "a");',
      },
      {
        name: 'should allow unrelated assert objects',
        code: 'other.assert.called(spy); import { assert } from "other"; assert.called(spy);',
      },
      {
        name: 'should allow shadowed Sinon imports',
        code: 'import sinon from "sinon"; function inspect(sinon) { sinon.assert.called(spy); }',
      },
      {
        name: 'should allow matcher-shaped property reads',
        code: 'import sinon from "sinon"; const method = sinon.assert.called;',
      },
    ],
    invalid: [
      {
        name: 'should report multiline computed Sinon assertion calls',
        code: 'import * as sinon from "sinon";\n(sinon["assert"])\n  /* assertion method */ ?.["calledWithMatch"]?.(spy, "a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'calledWithMatch', replacement: 'getCall' },
          },
        ],
      },
      {
        name: 'should report called assertions',
        code: 'import sinon from "sinon"; sinon.assert.called(spy);',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'called', replacement: 'callCount' },
          },
        ],
      },
      {
        name: 'should report called assertions even when passed a numbered call',
        code: 'import { assert } from "sinon"; assert.called(spy.getCall(0));',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'called', replacement: 'callCount' },
          },
        ],
      },
      {
        name: 'should report calledWith assertions',
        code: 'import * as sinon from "sinon"; sinon.assert.calledWith(spy, "a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'calledWith', replacement: 'getCall' },
          },
        ],
      },
      {
        name: 'should report calledWithExactly on the whole spy',
        code: 'import { assert as check } from "sinon"; check.calledWithExactly(spy, "a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'calledWithExactly', replacement: 'getCall' },
          },
        ],
      },
      {
        name: 'should report computed calledWithMatch assertions',
        code: 'import sinon from "sinon"; sinon["assert"]["calledWithMatch"](spy, "a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'calledWithMatch', replacement: 'getCall' },
          },
        ],
      },
      {
        name: 'should report getCall without an index',
        code: 'import { assert } from "sinon"; assert.calledWithExactly(spy.getCall(), "a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'calledWithExactly', replacement: 'getCall' },
          },
        ],
      },
      {
        name: 'should report calledWith without a spy argument',
        code: 'import { assert } from "sinon"; assert.calledWith();',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { assertion: 'calledWith', replacement: 'getCall' },
          },
        ],
      },
    ],
  });
});
