import { ruleTester } from '../testing/test-helper';
import { preferNullishCoalescing } from './prefer-nullish-coalescing';

describe('prefer-nullish-coalescing', () => {
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
        name: 'should preserve a local nullish guard when the selected branch uses another value',
        code: 'const user = getUser(); const value = user != null ? account : fallback;',
      },
      {
        name: 'should allow loose inequality when comparing against non-null literal',
        code: "const value = user != 0 ? user : 'guest';",
      },
      {
        name: 'should preserve repeated computed property access and possible getters',
        code: 'const value = obj[key] != null ? obj[key] : fallback;',
      },
      {
        name: 'should preserve repeated private field access',
        code: "class Example { #value: string | null = null; read() { const value = this.#value != null ? this.#value : 'guest'; return value; } }",
      },
      {
        name: 'should preserve repeated function calls with side effects',
        code: 'const value = read() != null ? read() : fallback;',
      },
      {
        name: 'should preserve unbound identifiers that may resolve to global accessors',
        code: 'const value = globalValue != null ? globalValue : fallback;',
      },
      {
        name: 'should preserve comments between nullish branches',
        code: 'const value = getValue(); const result = value != null ? value : /* keep */ fallback;',
      },
    ],
    invalid: [
      {
        name: 'should prefer nullish coalescing for != null guard',
        code: "const user = getUser(); const value = user != null ? user : 'guest';",
        output: "const user = getUser(); const value = ((user) ?? ('guest'));",
        errors: [{ messageId: 'preferNullish' }],
      },
      {
        name: 'should prefer nullish coalescing for == null guard with swapped branches',
        code: "const user = getUser(); const value = user == null ? 'guest' : user;",
        output: "const user = getUser(); const value = ((user) ?? ('guest'));",
        errors: [{ messageId: 'preferNullish' }],
      },
      {
        name: 'should prefer nullish coalescing for null on the left side',
        code: "const user = getUser(); const value = null != user ? user : 'guest';",
        output: "const user = getUser(); const value = ((user) ?? ('guest'));",
        errors: [{ messageId: 'preferNullish' }],
      },
      {
        name: 'should preserve a logical fallback as one coalescing operand',
        code: 'const value = getValue(); const result = value != null ? value : fallback && ready;',
        output: 'const value = getValue(); const result = ((value) ?? (fallback && ready));',
        errors: [{ messageId: 'preferNullish' }],
      },
      {
        name: 'should preserve a conditional fallback as one coalescing operand',
        code: 'const value = getValue(); const result = value != null ? value : ready ? left : right;',
        output: 'const value = getValue(); const result = ((value) ?? (ready ? left : right));',
        errors: [{ messageId: 'preferNullish' }],
      },
    ],
  });
});
