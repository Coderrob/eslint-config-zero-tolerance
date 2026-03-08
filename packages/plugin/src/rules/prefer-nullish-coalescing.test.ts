import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { preferNullishCoalescing } from './prefer-nullish-coalescing';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('prefer-nullish-coalescing', preferNullishCoalescing, {
  valid: [
    {
      name: 'should allow ternaries that check for undefined only',
      code: "const value = user !== undefined ? user : 'guest';",
    },
    {
      name: 'should allow non-nullish guards',
      code: "const value = flag ? 'yes' : 'no';",
    },
    {
      name: 'should require repeated expression to match the guard',
      code: "const value = user != null ? user.toString() : 'guest';",
    },
    {
      name: 'should allow loose inequality when comparing against non-null literal',
      code: "const value = user != 0 ? user : 'guest';",
    },
  ],
  invalid: [
    {
      name: 'should prefer nullish coalescing for != null guard',
      code: "const value = user != null ? user : 'guest';",
      output: "const value = user ?? 'guest';",
      errors: [{ messageId: 'preferNullish' }],
    },
    {
      name: 'should prefer nullish coalescing for == null guard with swapped branches',
      code: "const value = user == null ? 'guest' : user;",
      output: "const value = user ?? 'guest';",
      errors: [{ messageId: 'preferNullish' }],
    },
    {
      name: 'should prefer nullish coalescing for null on the left side',
      code: "const value = null != user ? user : 'guest';",
      output: "const value = user ?? 'guest';",
      errors: [{ messageId: 'preferNullish' }],
    },
  ],
});
