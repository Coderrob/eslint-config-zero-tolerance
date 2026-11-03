import { ruleTester } from '../testing/test-helper';
import { noChaiImpreciseSpyAssertions } from './no-chai-imprecise-spy-assertions';

describe('no-chai-imprecise-spy-assertions', () => {
  ruleTester.run('no-chai-imprecise-spy-assertions', noChaiImpreciseSpyAssertions, {
    valid: [
      {
        name: 'should allow explicit call counts',
        code: 'import { expect } from "chai"; expect(spy).to.have.callCount(2);',
      },
      {
        name: 'should allow negated called assertions for zero calls',
        code: 'import { expect } from "chai"; expect(spy).to.not.have.been.called; expect(spy)["to"]["not"]["been"]["called"];',
      },
      {
        name: 'should allow exact single-call assertions',
        code: 'import { expect } from "chai"; expect(spy).to.have.been.calledOnce; expect(spy).to.have.been.calledOnceWithExactly("a");',
      },
      {
        name: 'should allow explicit invocation arguments',
        code: 'import { expect } from "chai"; expect(spy.getCall(0).args).to.deep.equal(["a"]);',
      },
      {
        name: 'should allow argument assertions on numbered spy calls',
        code: 'import { expect } from "chai"; expect(spy.getCall(0)).to.have.been.calledWithExactly("a"); expect(spy["getCall"](1)).that.has.been.calledWith("b");',
      },
      {
        name: 'should allow parenthesized numbered spy calls across computed chains',
        code: 'import { expect as check } from "chai";\n(check)((spy["getCall"])(0))\n  ["that"] /* language chain */ .has.been["calledWithExactly"]("a");',
      },
      {
        name: 'should allow negated zero-call assertions with alternate Chai chains',
        code: 'import { expect } from "chai"; expect(spy).to.not.be.called;',
      },
      {
        name: 'should allow unrelated objects and assertion packages',
        code: 'object.called; import { expect } from "other"; expect(spy).to.have.been.called;',
      },
      {
        name: 'should allow a shadowed expect binding',
        code: 'import { expect } from "chai"; function inspect(expect) { expect(spy).to.have.been.called; }',
      },
      {
        name: 'should allow unsupported chain words',
        code: 'import { expect } from "chai"; expect(spy).custom.called;',
      },
      {
        name: 'should allow dynamically computed Chai chain words',
        code: 'import { expect } from "chai"; expect(spy)[word].called;',
      },
    ],
    invalid: [
      {
        name: 'should report multiline computed Chai chains through parenthesized expect',
        code: 'import { expect as check } from "chai";\n(check)(spy)\n  ["that"] /* language chain */ .has.been["calledWithExactly"]("a");',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'calledWithExactly' } }],
      },
      {
        name: 'should report positive called property assertions',
        code: 'import { expect } from "chai"; expect(spy).to.have.been.called;',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'called' } }],
      },
      {
        name: 'should report calledWith assertions',
        code: 'import { expect } from "chai"; expect(spy).to.have.been.calledWith("a");',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'calledWith' } }],
      },
      {
        name: 'should report calledWithExactly across unspecified calls',
        code: 'import { expect } from "chai"; expect(spy).to.have.been.calledWithExactly("a");',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'calledWithExactly' } }],
      },
      {
        name: 'should report negated argument assertions',
        code: 'import { expect } from "chai"; expect(spy).to.not.have.been.calledWithMatch("a");',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'calledWithMatch' } }],
      },
      {
        name: 'should report Chai namespace expect aliases',
        code: 'import * as chai from "chai"; chai.expect(spy)["to"]["have"]["been"]["called"];',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'called' } }],
      },
      {
        name: 'should report Vitest Chai-style assertions',
        code: 'import { expect as check } from "vitest"; check(spy).to.have.been.calledWith("a");',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'calledWith' } }],
      },
      {
        name: 'should report alternate Chai language chains',
        code: 'import { expect } from "chai"; expect(spy).to.be.called; expect(spy).that.has.been.calledWith("a");',
        errors: [
          { messageId: 'impreciseSpyAssertion', data: { matcher: 'called' } },
          { messageId: 'impreciseSpyAssertion', data: { matcher: 'calledWith' } },
        ],
      },
      {
        name: 'should report Vitest Chai-style last-call assertions',
        code: 'import { expect } from "vitest"; expect(spy).to.have.been.lastCalledWith("a");',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'lastCalledWith' } }],
      },
      {
        name: 'should report soft Vitest Chai-style assertions',
        code: 'import { expect as check } from "vitest"; check.soft(spy).to.be.called;',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'called' } }],
      },
      {
        name: 'should report argument assertions when getCall has no index',
        code: 'import { expect } from "chai"; expect(spy.getCall()).to.have.been.calledWith("a");',
        errors: [{ messageId: 'impreciseSpyAssertion', data: { matcher: 'calledWith' } }],
      },
    ],
  });
});
