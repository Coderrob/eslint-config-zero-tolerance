import { ruleTester } from '../testing/test-helper';
import { noMockImplementation } from './no-mock-implementation';

describe('no-mock-implementation', () => {
  ruleTester.run('no-mock-implementation', noMockImplementation, {
    valid: [
      {
        code: 'jest.fn().mockImplementationOnce(() => 42);',
        name: 'should allow mockImplementationOnce',
      },
      {
        code: 'jest.fn().mockReturnValueOnce(42);',
        name: 'should allow mockReturnValueOnce',
      },
      {
        code: 'jest.fn().mockResolvedValueOnce("value");',
        name: 'should allow mockResolvedValueOnce',
      },
      {
        code: 'jest.fn().mockRejectedValueOnce(new Error("err"));',
        name: 'should allow mockRejectedValueOnce',
      },
      {
        code: 'jest.fn().mockName("myMock");',
        name: 'should allow unrelated mock methods',
      },
      {
        code: 'jest.fn().mockClear();',
        name: 'should allow mockClear',
      },
      {
        code: 'jest.fn().mockReset();',
        name: 'should allow mockReset',
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
        code: 'const method = "mockReturnValue"; jest.fn()[method](42);',
        name: 'should ignore computed identifier properties',
      },
      {
        code: 'jest.fn()[1](42);',
        name: 'should ignore computed numeric properties',
      },
    ],
    invalid: [
      {
        code: 'jest.fn().mockImplementation(() => 42);',
        name: 'should report mockImplementation',
        errors: [
          {
            messageId: 'noMockImplementation',
            data: { method: 'mockImplementation', replacement: 'mockImplementationOnce' },
          },
        ],
      },
      {
        code: 'jest.fn().mockReturnValue(42);',
        name: 'should report mockReturnValue',
        errors: [
          {
            messageId: 'noMockImplementation',
            data: { method: 'mockReturnValue', replacement: 'mockReturnValueOnce' },
          },
        ],
      },
      {
        code: 'jest.fn().mockResolvedValue("value");',
        name: 'should report mockResolvedValue',
        errors: [
          {
            messageId: 'noMockImplementation',
            data: { method: 'mockResolvedValue', replacement: 'mockResolvedValueOnce' },
          },
        ],
      },
      {
        code: 'jest.fn().mockRejectedValue(new Error("err"));',
        name: 'should report mockRejectedValue',
        errors: [
          {
            messageId: 'noMockImplementation',
            data: { method: 'mockRejectedValue', replacement: 'mockRejectedValueOnce' },
          },
        ],
      },
      {
        code: 'myMock.mockImplementation(() => {}).mockReturnValue(true);',
        name: 'should report chained banned mock methods',
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
      {
        code: "jest.fn()['mockReturnValue'](42);",
        name: 'should report computed access of mockReturnValue',
        errors: [
          {
            messageId: 'noMockImplementation',
            data: { method: 'mockReturnValue', replacement: 'mockReturnValueOnce' },
          },
        ],
      },
      {
        code: "jest.fn()['mockImplementation'](() => {});",
        name: 'should report computed access of mockImplementation',
        errors: [
          {
            messageId: 'noMockImplementation',
            data: { method: 'mockImplementation', replacement: 'mockImplementationOnce' },
          },
        ],
      },
    ],
  });
});
