import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { zodSchemaDescription } from './zod-schema-description';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('zod-schema-description', zodSchemaDescription, {
  valid: [
    {
      code: 'const schema = z.string().describe("A string");',
      name: 'simple string schema with description',
    },
    {
      code: 'const userSchema = z.object({ name: z.string() }).describe("User object");',
      name: 'object schema with description',
    },
    {
      code: 'const schema = z.number().min(0).describe("A positive number");',
      name: 'chained schema with description',
    },
    {
      code: 'const nonZodVar = someFunction();',
      name: 'non-Zod variable assignment',
    },
    {
      code: 'const arraySchema = z.array(z.string()).describe("String array");',
      name: 'array schema with description',
    },
    {
      code: 'const unionSchema = z.union([z.string(), z.number()]).describe("String or number");',
      name: 'union schema with description',
    },
    {
      code: 'const optionalSchema = z.string().optional().describe("Optional string");',
      name: 'optional schema with description',
    },
    {
      code: 'const complexSchema = z.object({ id: z.number(), name: z.string() }).strict().describe("Complex object");',
      name: 'complex chained schema with description',
    },
    {
      code: 'const literalSchema = z.literal("active").describe("Active literal");',
      name: 'literal schema with description',
    },
    {
      code: 'let schema; schema = z.string().describe("Assigned later");',
      name: 'schema assigned with description',
    },
  ],
  invalid: [
    {
      code: 'const schema = z.string();',
      name: 'string schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const userSchema = z.object({ name: z.string() });',
      name: 'object schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const schema = z.number().min(0);',
      name: 'chained schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const arraySchema = z.array(z.string());',
      name: 'array schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const unionSchema = z.union([z.string(), z.number()]);',
      name: 'union schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const optionalSchema = z.string().optional();',
      name: 'optional schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const nullableSchema = z.string().nullable();',
      name: 'nullable schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
    {
      code: 'const refinedSchema = z.string().refine((val) => val.length > 0);',
      name: 'refined schema without description',
      errors: [
        {
          messageId: 'zodSchemaDescription',
        },
      ],
    },
  ],
} as any);
