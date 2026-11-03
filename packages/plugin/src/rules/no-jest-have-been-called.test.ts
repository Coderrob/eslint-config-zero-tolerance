import { ruleTester } from '../testing/test-helper';
import { noJestHaveBeenCalled } from './no-jest-have-been-called';

describe('no-jest-have-been-called', () => {
  ruleTester.run('no-jest-have-been-called', noJestHaveBeenCalled, {
    valid: [
      {
        name: 'should allow computed and optional prototype properties',
        code: 'value["toString"](); value?.toString?.(); value.valueOf(); value["hasOwnProperty"]("key"); value.__proto__; value.toLocaleString();',
      },

      {
        code: 'expect(fn).toHaveBeenCalledTimes(1);',
        name: 'should allow toHaveBeenCalledTimes',
      },
      {
        code: 'expect(fn).toHaveBeenNthCalledWith(1, "arg");',
        name: 'should allow toHaveBeenNthCalledWith',
      },
      {
        code: 'expect(fn).not.toHaveBeenCalledTimes(0);',
        name: 'should allow negated toHaveBeenCalledTimes',
      },
      {
        code: 'expect(fn).not.toHaveBeenCalled(); expect(fn).not.toBeCalled();',
        name: 'should allow negated called matchers that assert zero calls',
      },
      {
        code: 'expect(fn)["not"]["toHaveBeenCalled"](); expect(fn).resolves.not.toBeCalled();',
        name: 'should allow computed and promise-modified zero-call assertions',
      },
      {
        code: 'expect(value).toBe(true);',
        name: 'should allow unrelated matcher',
      },
      {
        code: 'expect(result).toEqual({ key: "value" });',
        name: 'should allow toEqual',
      },
      {
        code: 'const text = value.toString();',
        name: 'should allow object prototype methods',
      },
      {
        code: 'const factory = value.constructor;',
        name: 'should allow inherited object property names',
      },
      {
        code: 'const matcher = "toHaveBeenCalled"; expect(fn)[matcher]();',
        name: 'should allow computed identifier property',
      },
      {
        code: 'expect(fn)[0]();',
        name: 'should allow computed numeric property',
      },
      {
        code: 'const method = obj.toHaveBeenCalled; obj.toHaveBeenCalled(); obj["toBeCalledWith"]("arg");',
        name: 'should allow banned names on unrelated objects',
      },
      {
        code: 'const matcher = expect(fn).toHaveBeenCalled; expect(fn).not.toBeCalledWith;',
        name: 'should allow matcher property references without invocation',
      },
      {
        code: 'other.expect(fn).toHaveBeenCalled(); wrap(expect(fn)).toBeCalled();',
        name: 'should allow calls outside a Jest expect chain',
      },
      {
        code: 'expect(fn).custom.toHaveBeenCalled(); expect(fn).not.custom.toBeCalled();',
        name: 'should allow unsupported intermediate properties',
      },
      {
        code: 'function check(expect) { expect(fn).toHaveBeenCalled(); } const expect = customExpect;',
        name: 'should allow a shadowed non-Jest expect function',
      },
      {
        code: 'import { expect as check } from "other-test-library"; check(fn).toHaveBeenCalled();',
        name: 'should allow expect imported from an unrelated library',
      },
      {
        code: 'function check(globalThis) { globalThis.expect(fn).toHaveBeenCalled(); }',
        name: 'should allow a shadowed global object',
      },
      {
        code: 'import { expect as check } from "@jest/globals"; (check)(fn)?.["not"]?.["toHaveBeenCalled"]?.();',
        name: 'should allow parenthesized optional zero-call assertions',
      },
    ],
    invalid: [
      {
        name: 'should reject matchers across multiline comments and parenthesized calls',
        code: 'import { expect as check } from "@jest/globals";\nvoid (check)(fn)\n  /* assertion modifier */ ["not"]\n  ?.["toHaveBeenCalledWith"]?.("a");',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        name: 'should reject asynchronous negated argument matchers',
        code: 'expect(fn).resolves.not["toHaveBeenCalledWith"]("arg"); expect(fn).rejects.toBeCalledWith("arg");',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'expect(fn).toHaveBeenCalled();',
        name: 'should ban toHaveBeenCalled',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: 'expect(fn).toBeCalled();',
        name: 'should ban toBeCalled (alias for toHaveBeenCalled)',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: 'expect(fn).toHaveBeenCalledWith("arg");',
        name: 'should ban toHaveBeenCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'expect(fn).toBeCalledWith("arg");',
        name: 'should ban toBeCalledWith (alias for toHaveBeenCalledWith)',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'expect(fn).toHaveBeenLastCalledWith("arg");',
        name: 'should ban toHaveBeenLastCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenLastCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'expect(fn).toLastCalledWith("arg");',
        name: 'should ban toLastCalledWith (alias for toHaveBeenLastCalledWith)',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toLastCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'expect(fn).not.toHaveBeenCalledWith("arg");',
        name: 'should ban negated toHaveBeenCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'expect(fn).not.toBeCalledWith("arg");',
        name: 'should ban negated toBeCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'globalThis.expect(fn).toHaveBeenCalled(); global.expect(fn).not.toBeCalledWith("arg");',
        name: 'should ban matchers on global Jest expect calls',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: 'expect(fn)?.toHaveBeenCalled?.();',
        name: 'should ban optional matcher calls on Jest expect',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: 'import { expect as check } from "@jest/globals"; check(fn).toHaveBeenCalled();',
        name: 'should ban matchers on imported Jest expect aliases',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: 'globalThis["expect"](fn).rejects["toBeCalled"](); expect?.(fn).toHaveBeenCalled();',
        name: 'should ban computed global expect and optional expect calls',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalled', replacement: 'toHaveBeenCalledTimes' },
          },
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: 'expect(fn).toHaveBeenCalledWith("a"); expect(fn).toHaveBeenCalled();',
        name: 'should ban multiple banned matchers in same code',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: "expect(fn)['toHaveBeenCalled']();",
        name: 'should ban computed access of toHaveBeenCalled',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: "expect(fn)['toHaveBeenCalledWith']('arg');",
        name: 'should ban computed access of toHaveBeenCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: "expect(fn)['toBeCalled']();",
        name: 'should ban computed access of toBeCalled',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalled', replacement: 'toHaveBeenCalledTimes' },
          },
        ],
      },
      {
        code: "expect(fn)['toBeCalledWith']('arg');",
        name: 'should ban computed access of toBeCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toBeCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: "expect(fn)['toHaveBeenLastCalledWith']('arg');",
        name: 'should ban computed access of toHaveBeenLastCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toHaveBeenLastCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
      {
        code: "expect(fn)['toLastCalledWith']('arg');",
        name: 'should ban computed access of toLastCalledWith',
        errors: [
          {
            messageId: 'noHaveBeenCalled',
            data: { matcher: 'toLastCalledWith', replacement: 'toHaveBeenNthCalledWith' },
          },
        ],
      },
    ],
  });
});
