import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { preferResultReturn } from './prefer-result-return';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('prefer-result-return', preferResultReturn, {
  valid: [
    {
      name: 'should allow result object return',
      code: 'function parse() { return { ok: false as const, error: "invalid" }; }',
    },
    {
      name: 'should allow throw in test files',
      filename: 'src/parser.test.ts',
      code: 'function parse() { throw new Error("invalid"); }',
    },
    {
      name: 'should allow throw in spec files',
      filename: 'src/parser.spec.ts',
      code: 'function parse() { throw new Error("invalid"); }',
    },
  ],
  invalid: [
    {
      name: 'should disallow throw statement in source files',
      filename: 'src/parser.ts',
      code: 'function parse() { throw new Error("invalid"); }',
      errors: [{ messageId: 'preferResultReturn' }],
    },
    {
      name: 'should disallow throw inside nested block',
      filename: 'src/parser.ts',
      code: 'function parse() { if (true) { throw new Error("invalid"); } return { ok: true as const }; }',
      errors: [{ messageId: 'preferResultReturn' }],
    },
    {
      name: 'should disallow throw statement at module scope in source files',
      filename: 'src/parser.ts',
      code: 'throw new Error("invalid");',
      errors: [{ messageId: 'preferResultReturn' }],
    },
  ],
});
