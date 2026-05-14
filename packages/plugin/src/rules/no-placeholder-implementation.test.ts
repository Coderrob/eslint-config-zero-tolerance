import { ruleTester } from '../testing/test-helper';
import { noPlaceholderImplementation } from './no-placeholder-implementation';

ruleTester.run('no-placeholder-implementation', noPlaceholderImplementation, {
  valid: [
    {
      name: 'should allow legitimate nullable branch with real logic',
      code: 'function find(value: string): string | null { if (value.length === 0) { return null; } return value; }',
    },
    {
      name: 'should allow placeholders in test files by default',
      filename: 'src/service.test.ts',
      code: "function load(): never { throw new Error('TODO'); }",
    },
    {
      name: 'should allow placeholders in comments when disabled',
      code: '// TODO documented migration note\nexport const value = 1;',
      options: [{ checkComments: false }],
    },
    {
      name: 'should allow placeholder words in JSDoc comments',
      code: '/** Returns placeholder text for docs. */\nexport function value(): string { return "done"; }',
    },
    {
      name: 'should allow non console placeholder calls',
      code: "logger.warn('stub');",
    },
    {
      name: 'should allow console calls without placeholder arguments',
      code: "console.warn('ready');",
    },
    {
      name: 'should allow placeholder terms configured as allowed',
      code: '// temporary migration\nexport const value = 1;',
      options: [{ allowedTerms: ['temporary'] }],
    },
    {
      name: 'should allow non Error placeholder throws',
      code: "function load(): never { throw new TypeError('TODO'); }",
    },
    {
      name: 'should allow spread console arguments',
      code: 'console.warn(...messages);',
    },
  ],
  invalid: [
    {
      name: 'should report TODO throw implementation',
      code: "function load(): never { throw new Error('TODO'); }",
      errors: [{ messageId: 'placeholderImplementation' }],
    },
    {
      name: 'should report null placeholder return',
      code: 'function load(): string | null { return null; }',
      errors: [{ messageId: 'placeholderImplementation' }],
    },
    {
      name: 'should report empty object placeholder return',
      code: 'function load(): object { return {}; }',
      errors: [{ messageId: 'placeholderImplementation' }],
    },
    {
      name: 'should report empty array placeholder return',
      code: 'function load(): unknown[] { return []; }',
      errors: [{ messageId: 'placeholderImplementation' }],
    },
    {
      name: 'should report console placeholder call',
      code: "console.warn('stub');",
      errors: [{ messageId: 'placeholderImplementation' }],
    },
    {
      name: 'should report placeholder comments',
      code: '// FIXME replace this\nexport const value = 1;',
      errors: [{ messageId: 'placeholderComment' }],
    },
  ],
});
