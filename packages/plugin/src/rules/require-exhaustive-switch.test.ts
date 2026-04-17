import process from 'node:process';
import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { requireExhaustiveSwitch } from './require-exhaustive-switch';

const typeAwareRuleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      projectService: {
        allowDefaultProject: ['src/*.ts', 'src/*.tsx'],
      },
      tsconfigRootDir: process.cwd(),
    },
  },
});

const untypedRuleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

typeAwareRuleTester.run('require-exhaustive-switch', requireExhaustiveSwitch, {
  valid: [
    {
      name: 'should ignore empty enums',
      filename: 'src/status.ts',
      code: `
        enum Status {}
        function render(status: Status): number {
          switch (status) {
          }
          return 0;
        }
      `,
    },
    {
      name: 'should allow exhaustive string union switches',
      filename: 'src/status.ts',
      code: `
        type Status = 'idle' | 'loading';
        function render(status: Status): number {
          switch (status) {
            case 'idle':
              return 0;
            case 'loading':
              return 1;
          }
        }
      `,
    },
    {
      name: 'should allow exhaustive boolean switches',
      filename: 'src/flag.ts',
      code: `
        function render(flag: boolean): number {
          switch (flag) {
            case true:
              return 1;
            case false:
              return 0;
          }
        }
      `,
    },
    {
      name: 'should allow default clauses as explicit fallback',
      filename: 'src/status.ts',
      code: `
        type Status = 'idle' | 'loading';
        function render(status: Status): number {
          switch (status) {
            case 'idle':
              return 0;
            default:
              return 1;
          }
        }
      `,
    },
    {
      name: 'should ignore open ended string switches',
      filename: 'src/status.ts',
      code: `
        function render(status: string): number {
          switch (status) {
            case 'idle':
              return 0;
          }
          return 1;
        }
      `,
    },
    {
      name: 'should ignore open ended union switches',
      filename: 'src/status.ts',
      code: `
        function render(status: 'idle' | number): number {
          switch (status) {
            case 'idle':
              return 0;
          }
          return 1;
        }
      `,
    },
    {
      name: 'should ignore single literal switches',
      filename: 'src/status.ts',
      code: `
        function render(status: 'idle'): number {
          switch (status) {
            case 'idle':
              return 0;
          }
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'should disallow non-exhaustive string union switches',
      filename: 'src/status.ts',
      code: `
        type Status = 'idle' | 'loading' | 'success';
        function render(status: Status): number {
          switch (status) {
            case 'idle':
              return 0;
            case 'loading':
              return 1;
          }
          return 2;
        }
      `,
      errors: [{ messageId: 'requireExhaustiveSwitch' }],
    },
    {
      name: 'should disallow non-exhaustive boolean switches',
      filename: 'src/flag.ts',
      code: `
        function render(flag: boolean): number {
          switch (flag) {
            case true:
              return 1;
          }
          return 0;
        }
      `,
      errors: [{ messageId: 'requireExhaustiveSwitch' }],
    },
    {
      name: 'should disallow non-exhaustive enum switches',
      filename: 'src/status.ts',
      code: `
        enum Status {
          Idle,
          Loading,
          Success,
        }
        function render(status: Status): number {
          switch (status) {
            case Status.Idle:
              return 0;
            case Status.Loading:
              return 1;
          }
          return 2;
        }
      `,
      errors: [{ messageId: 'requireExhaustiveSwitch' }],
    },
    {
      name: 'should disallow non-exhaustive bigint union switches',
      filename: 'src/status.ts',
      code: `
        type Size = 1n | 2n;
        function render(size: Size): number {
          switch (size) {
            case 1n:
              return 1;
          }
          return 0;
        }
      `,
      errors: [{ messageId: 'requireExhaustiveSwitch' }],
    },
    {
      name: 'should disallow non-exhaustive negative bigint union switches',
      filename: 'src/status.ts',
      code: `
        type Size = -1n | 2n;
        function render(size: Size): number {
          switch (size) {
            case 2n:
              return 2;
          }
          return 0;
        }
      `,
      errors: [{ messageId: 'requireExhaustiveSwitch' }],
    },
    {
      name: 'should disallow non-exhaustive number union switches',
      filename: 'src/status.ts',
      code: `
        type Step = 1 | 2 | 3;
        function render(step: Step): number {
          switch (step) {
            case 1:
              return 1;
            case 2:
              return 2;
          }
          return 0;
        }
      `,
      errors: [{ messageId: 'requireExhaustiveSwitch' }],
    },
    {
      name: 'should disallow non-exhaustive mixed literal switches',
      filename: 'src/status.ts',
      code: `
        type Value = true | 1;
        function render(value: Value): number {
          switch (value) {
            case 1:
              return 1;
          }
          return 0;
        }
      `,
      errors: [{ messageId: 'requireExhaustiveSwitch' }],
    },
  ],
});

untypedRuleTester.run(
  'require-exhaustive-switch without type information',
  requireExhaustiveSwitch,
  {
    valid: [
      {
        name: 'should ignore switches when parser services are unavailable',
        filename: 'src/status.ts',
        code: `
          function render(status: string): number {
            switch (status) {
              case 'idle':
                return 0;
            }
            return 1;
          }
        `,
      },
    ],
    invalid: [],
  },
);
