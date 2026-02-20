import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noMockImplementation } from './no-mock-implementation';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('no-mock-implementation', noMockImplementation, {
  valid: [
    {
      code: 'jest.fn().mockImplementationOnce(() => 42);',
      name: 'mockImplementationOnce is allowed',
    },
    {
      code: 'jest.fn().mockReturnValueOnce(42);',
      name: 'mockReturnValueOnce is allowed',
    },
    {
      code: 'jest.fn().mockResolvedValueOnce("value");',
      name: 'mockResolvedValueOnce is allowed',
    },
    {
      code: 'jest.fn().mockRejectedValueOnce(new Error("err"));',
      name: 'mockRejectedValueOnce is allowed',
    },
    {
      code: 'jest.fn().mockName("myMock");',
      name: 'unrelated mock method is allowed',
    },
    {
      code: 'jest.fn().mockClear();',
      name: 'mockClear is allowed',
    },
    {
      code: 'jest.fn().mockReset();',
      name: 'mockReset is allowed',
    },
  ],
  invalid: [
    {
      code: 'jest.fn().mockImplementation(() => 42);',
      name: 'mockImplementation is banned',
      errors: [
        {
          messageId: 'noMockImplementation',
          data: { method: 'mockImplementation', replacement: 'mockImplementationOnce' },
        },
      ],
    },
    {
      code: 'jest.fn().mockReturnValue(42);',
      name: 'mockReturnValue is banned',
      errors: [
        {
          messageId: 'noMockImplementation',
          data: { method: 'mockReturnValue', replacement: 'mockReturnValueOnce' },
        },
      ],
    },
    {
      code: 'jest.fn().mockResolvedValue("value");',
      name: 'mockResolvedValue is banned',
      errors: [
        {
          messageId: 'noMockImplementation',
          data: { method: 'mockResolvedValue', replacement: 'mockResolvedValueOnce' },
        },
      ],
    },
    {
      code: 'jest.fn().mockRejectedValue(new Error("err"));',
      name: 'mockRejectedValue is banned',
      errors: [
        {
          messageId: 'noMockImplementation',
          data: { method: 'mockRejectedValue', replacement: 'mockRejectedValueOnce' },
        },
      ],
    },
    {
      code: 'myMock.mockImplementation(() => {}).mockReturnValue(true);',
      name: 'chained banned mock methods',
      errors: [
        {
          messageId: 'noMockImplementation',
          data: { method: 'mockImplementation', replacement: 'mockImplementationOnce' },
        },
        {
          messageId: 'noMockImplementation',
          data: { method: 'mockReturnValue', replacement: 'mockReturnValueOnce' },
        },
      ],
    },
  ],
} as any);
