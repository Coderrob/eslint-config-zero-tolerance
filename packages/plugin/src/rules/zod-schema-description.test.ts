import { TSESLint } from '@typescript-eslint/utils';
import { zodSchemaDescription } from './zod-schema-description';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('zod-schema-description', zodSchemaDescription, {
  valid: [
    {
      code: 'const schema = z.string().describe("A string");',
    },
    {
      code: 'const userSchema = z.object({ name: z.string() }).describe("User object");',
    },
    {
      code: 'const schema = z.number().min(0).describe("A positive number");',
    },
    {
      code: 'const nonZodVar = someFunction();',
    },
  ],
  invalid: [
    {
      code: 'const schema = z.string();',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const userSchema = z.object({ name: z.string() });',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const schema = z.number().min(0);',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
  ],
});
