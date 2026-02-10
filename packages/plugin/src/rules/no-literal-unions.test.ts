import { TSESLint } from '@typescript-eslint/utils';
import { noLiteralUnions } from './no-literal-unions';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('no-literal-unions', noLiteralUnions, {
  valid: [
    {
      code: 'type Numbers = number | string;',
    },
    {
      code: 'type Mixed = boolean | null | undefined;',
    },
    {
      code: 'enum Status { Active = "active", Inactive = "inactive" }',
    },
    {
      code: 'type MyType = string;',
    },
  ],
  invalid: [
    {
      code: 'type Status = "active" | "inactive";',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Size = "small" | "medium" | "large";',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
    {
      code: 'type Count = 1 | 2 | 3;',
      errors: [
        {
          messageId: 'noLiteralUnions',
        },
      ],
    },
  ],
});
