import { ruleTester } from '../testing/test-helper';
import { noJestHaveBeenCalled } from './no-jest-have-been-called';

ruleTester.run('no-jest-have-been-called', noJestHaveBeenCalled, {
  valid: [
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
      code: 'expect(value).toBe(true);',
      name: 'should allow unrelated matcher',
    },
    {
      code: 'expect(result).toEqual({ key: "value" });',
      name: 'should allow toEqual',
    },
    {
      code: 'const matcher = "toHaveBeenCalled"; expect(fn)[matcher]();',
      name: 'should allow computed identifier property',
    },
    {
      code: 'expect(fn)[0]();',
      name: 'should allow computed numeric property',
    },
  ],
  invalid: [
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
      code: 'expect(fn).not.toHaveBeenCalled();',
      name: 'should ban negated toHaveBeenCalled',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
        },
      ],
    },
    {
      code: 'expect(fn).not.toBeCalled();',
      name: 'should ban negated toBeCalled',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toBeCalled', replacement: 'toHaveBeenCalledTimes' },
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
      code: 'const x = obj.toHaveBeenCalled;',
      name: 'should ban property access of toHaveBeenCalled',
      errors: [
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
