import { ruleTester } from '../test-helper';
import { preferNullishCoalescing } from './prefer-nullish-coalescing';

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
    {
      name: 'should prefer nullish coalescing for identifier computed keys',
      code: 'const value = obj[key] != null ? obj[key] : fallback;',
      output: 'const value = obj[key] ?? fallback;',
      errors: [{ messageId: 'preferNullish' }],
    },
    {
      name: 'should prefer nullish coalescing for private field checks',
      code: "class Example { #value: string | null = null; read() { const value = this.#value != null ? this.#value : 'guest'; return value; } }",
      output:
        "class Example { #value: string | null = null; read() { const value = this.#value ?? 'guest'; return value; } }",
      errors: [{ messageId: 'preferNullish' }],
    },
  ],
});
