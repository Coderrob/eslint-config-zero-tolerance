import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noJestHaveBeenCalled } from './no-jest-have-been-called';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-jest-have-been-called', noJestHaveBeenCalled, {
  valid: [
    {
      code: 'expect(fn).toHaveBeenCalledTimes(1);',
      name: 'toHaveBeenCalledTimes is allowed',
    },
    {
      code: 'expect(fn).toHaveBeenNthCalledWith(1, "arg");',
      name: 'toHaveBeenNthCalledWith is allowed',
    },
    {
      code: 'expect(fn).not.toHaveBeenCalledTimes(0);',
      name: 'negated toHaveBeenCalledTimes is allowed',
    },
    {
      code: 'expect(value).toBe(true);',
      name: 'unrelated matcher is allowed',
    },
    {
      code: 'expect(result).toEqual({ key: "value" });',
      name: 'toEqual is allowed',
    },
  ],
  invalid: [
    {
      code: 'expect(fn).toHaveBeenCalled();',
      name: 'toHaveBeenCalled is banned',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
        },
      ],
    },
    {
      code: 'expect(fn).toHaveBeenCalledWith("arg");',
      name: 'toHaveBeenCalledWith is banned',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
        },
      ],
    },
    {
      code: 'expect(fn).not.toHaveBeenCalled();',
      name: 'negated toHaveBeenCalled is banned',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
        },
      ],
    },
    {
      code: 'expect(fn).not.toHaveBeenCalledWith("arg");',
      name: 'negated toHaveBeenCalledWith is banned',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
        },
      ],
    },
    {
      code: 'const x = obj.toHaveBeenCalled;',
      name: 'property access of banned matcher is also banned',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
        },
      ],
    },
    {
      code: 'expect(fn).toHaveBeenCalledWith("a"); expect(fn).toHaveBeenCalled();',
      name: 'both banned matchers in same code',
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
      name: 'computed access of toHaveBeenCalled is banned',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalled', replacement: 'toHaveBeenCalledTimes' },
        },
      ],
    },
    {
      code: "expect(fn)['toHaveBeenCalledWith']('arg');",
      name: 'computed access of toHaveBeenCalledWith is banned',
      errors: [
        {
          messageId: 'noHaveBeenCalled',
          data: { matcher: 'toHaveBeenCalledWith', replacement: 'toHaveBeenNthCalledWith' },
        },
      ],
    },
  ],
} as any);
