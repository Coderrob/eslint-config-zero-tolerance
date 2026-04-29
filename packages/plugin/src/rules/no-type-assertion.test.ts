import { ruleTester } from '../testing/test-helper';
import { noTypeAssertion } from './no-type-assertion';

ruleTester.run('no-type-assertion', noTypeAssertion, {
  valid: [
    {
      name: 'should allow no type assertion in non-test file',
      filename: 'src/utils.ts',
      code: 'const x: string = getValue();',
    },
    {
      name: 'should allow as unknown in test file',
      filename: 'src/foo.test.ts',
      code: 'const x = getValue() as unknown;',
    },
    {
      name: 'should allow as unknown in spec file',
      filename: 'src/foo.spec.ts',
      code: 'const y = getValue() as unknown;',
    },
    {
      name: 'should allow explicit type annotation in non-test file',
      filename: 'src/helper.ts',
      code: 'function foo(x: number): number { return x; }',
    },
    {
      name: 'should allow as unknown in test tsx file',
      filename: 'src/bar.test.tsx',
      code: 'const z = getValue() as unknown;',
    },
    {
      name: 'should allow angle bracket unknown assertion in test file',
      filename: 'src/bar.test.ts',
      code: 'const z = <unknown>getValue();',
    },
  ],
  invalid: [
    {
      name: 'should report as string in non-test file',
      filename: 'src/utils.ts',
      code: 'const x = getValue() as string;',
      errors: [
        {
          messageId: 'noTypeAssertion',
          data: { assertion: 'as string' },
          suggestions: [
            {
              messageId: 'useSatisfies',
              output: 'const x = getValue() satisfies string;',
            },
          ],
        },
      ],
    },
    {
      name: 'should report as unknown in non-test file',
      filename: 'src/utils.ts',
      code: 'const x = getValue() as unknown;',
      errors: [
        {
          messageId: 'noTypeAssertion',
          data: { assertion: 'as unknown' },
          suggestions: [
            {
              messageId: 'useSatisfies',
              output: 'const x = getValue() satisfies unknown;',
            },
          ],
        },
      ],
    },
    {
      name: 'should report as string in test file',
      filename: 'src/foo.test.ts',
      code: 'const x = getValue() as string;',
      errors: [
        {
          messageId: 'noTypeAssertion',
          data: { assertion: 'as string' },
          suggestions: [
            {
              messageId: 'useSatisfies',
              output: 'const x = getValue() satisfies string;',
            },
          ],
        },
      ],
    },
    {
      name: 'should report as MyType in non-test file',
      filename: 'src/utils.ts',
      code: 'const x = getValue() as MyType;',
      errors: [
        {
          messageId: 'noTypeAssertion',
          data: { assertion: 'as MyType' },
          suggestions: [
            {
              messageId: 'useSatisfies',
              output: 'const x = getValue() satisfies MyType;',
            },
          ],
        },
      ],
    },
    {
      name: 'should report as number in spec file',
      filename: 'src/bar.spec.ts',
      code: 'const x = getValue() as number;',
      errors: [
        {
          messageId: 'noTypeAssertion',
          data: { assertion: 'as number' },
          suggestions: [
            {
              messageId: 'useSatisfies',
              output: 'const x = getValue() satisfies number;',
            },
          ],
        },
      ],
    },
    {
      name: 'should report angle bracket assertion in non-test file',
      filename: 'src/utils.ts',
      code: 'const x = <MyType>getValue();',
      errors: [{ messageId: 'noTypeAssertion', data: { assertion: '<MyType>' }, suggestions: [] }],
    },
    {
      name: 'should report angle bracket unknown assertion in non-test file',
      filename: 'src/utils.ts',
      code: 'const x = <unknown>getValue();',
      errors: [{ messageId: 'noTypeAssertion', data: { assertion: '<unknown>' } }],
    },
    {
      name: 'should report angle bracket assertion in test file',
      filename: 'src/foo.test.ts',
      code: 'const x = <number>getValue();',
      errors: [{ messageId: 'noTypeAssertion', data: { assertion: '<number>' } }],
    },
  ],
});
