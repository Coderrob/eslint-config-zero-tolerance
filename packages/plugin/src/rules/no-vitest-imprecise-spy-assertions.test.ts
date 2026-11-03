import { ruleTester } from '../testing/test-helper';
import { noVitestImpreciseSpyAssertions } from './no-vitest-imprecise-spy-assertions';

describe('no-vitest-imprecise-spy-assertions', () => {
  ruleTester.run('no-vitest-imprecise-spy-assertions', noVitestImpreciseSpyAssertions, {
    valid: [
      {
        name: 'should allow exact Vitest call assertions',
        code: 'import { expect } from "vitest"; expect(fn).toHaveBeenCalledTimes(2); expect(fn).toHaveBeenNthCalledWith(1, "a"); expect(fn).toHaveBeenCalledExactlyOnceWith("a");',
      },
      {
        name: 'should allow negated zero-call assertions',
        code: 'import { expect } from "vitest"; expect(fn).not.toHaveBeenCalled(); expect(fn)["not"]["toHaveBeenCalled"]();',
      },
      {
        name: 'should allow soft negated zero-call assertions',
        code: 'import { expect } from "vitest"; expect.soft(fn).not.toHaveBeenCalled();',
      },
      {
        name: 'should allow parenthesized optional soft zero-call assertions',
        code: 'import { expect as check } from "vitest"; (check["soft"])(fn)?.["not"]?.["toHaveBeenCalled"]?.();',
      },
      {
        name: 'should allow unrelated and shadowed expect calls',
        code: 'import { expect as check } from "vitest"; expect(fn).toHaveBeenCalled(); function inspect(check) { check(fn).toHaveBeenCalled(); }',
      },
      {
        name: 'should allow matcher-shaped methods on unrelated objects',
        code: 'const method = object.toHaveBeenCalled; object.toHaveBeenCalled();',
      },
      {
        name: 'should allow soft methods on unrelated objects',
        code: 'import { expect } from "vitest"; other.soft(fn).toHaveBeenCalled();',
      },
      {
        name: 'should allow matcher property reads without a call',
        code: 'import { expect } from "vitest"; const matcher = expect(fn).toHaveBeenCalled;',
      },
      {
        name: 'should allow unsupported modifier chains',
        code: 'import { expect } from "vitest"; expect(fn).custom.toHaveBeenCalled();',
      },
      {
        name: 'should allow dynamically computed assertion modifiers',
        code: 'import { expect } from "vitest"; expect(fn)[modifier].toHaveBeenCalled();',
      },
      {
        name: 'should allow names imported from other test packages',
        code: 'import { expect } from "chai"; expect(fn).toHaveBeenCalled();',
      },
    ],
    invalid: [
      {
        name: 'should report soft assertions across multiline comments and computed members',
        code: 'import { expect as check } from "vitest";\n(check /* import alias */ ["soft"])(fn)\n  /* assertion matcher */ ["toHaveBeenCalledWith"]("a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        name: 'should report a positive called assertion',
        code: 'import { expect } from "vitest"; expect(fn).toHaveBeenCalled();',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        name: 'should report a called-with assertion',
        code: 'import { expect } from "vitest"; expect(fn).toHaveBeenCalledWith("a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        name: 'should report a last-call assertion',
        code: 'import { expect } from "vitest"; expect(fn).toHaveBeenLastCalledWith("a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenLastCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        name: 'should report aliases with computed and promise modifiers',
        code: 'import { expect as check } from "vitest"; check(fn).resolves.not["toHaveBeenCalledWith"]("a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        name: 'should report optional matcher calls',
        code: 'import { expect } from "vitest"; expect(fn)?.toHaveBeenCalled?.();',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        name: 'should report non-negating promise modifiers on called assertions',
        code: 'import { expect } from "vitest"; expect(fn).resolves.toHaveBeenCalled();',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        name: 'should report soft expect assertions',
        code: 'import { expect as check } from "vitest"; check.soft(fn).toHaveBeenCalled(); check["soft"](fn).toHaveBeenCalledWith("a");',
        errors: [
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
          {
            messageId: 'impreciseSpyAssertion',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
    ],
  });
});
