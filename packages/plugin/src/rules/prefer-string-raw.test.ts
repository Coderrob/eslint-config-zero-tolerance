import { ruleTester } from '../testing/test-helper';
import { preferStringRaw } from './prefer-string-raw';

const BACKSLASH_CHARACTER_CODE = 92;
const BACKSLASH = String.fromCharCode(BACKSLASH_CHARACTER_CODE);

describe('prefer-string-raw', () => {
  ruleTester.run('prefer-string-raw', preferStringRaw, {
    valid: [
      {
        code: "const greeting = 'hello world';",
        name: 'should allow string literals without backslashes',
      },
      {
        code: 'const version = 42;',
        name: 'should allow non-string literals',
      },
      {
        code: String.raw`const quote = 'it\'s done';`,
        name: 'should allow literals that only escape quote characters',
      },
      {
        code: ['const path = String.raw`C:', 'Users', 'dev', 'repo`;'].join(BACKSLASH),
        name: 'should allow String.raw tagged templates',
      },
      {
        code: String.raw`const expression = /\d+\w+/u;`,
        name: 'should allow regular expression literals',
      },
      {
        code: String.raw`const pattern = '\\d+\n';`,
        name: 'should allow strings mixing escaped backslashes with runtime escapes',
      },
      {
        code: String.raw`const slash = '\\';`,
        name: 'should allow strings ending with a backslash that cannot be safely fixed',
      },
      {
        code: [`const source = 'C:`, "${name}';"].join(`${BACKSLASH}${BACKSLASH}`),
        name: 'should allow strings containing template interpolation syntax that cannot be safely fixed',
      },
      {
        code: String.raw`const patterns = {'\\d+': true};`,
        name: 'should allow non-computed object property keys',
      },
      {
        code: String.raw`type Pattern = '\\d+';`,
        name: 'should allow TypeScript literal types',
      },
      {
        code: String.raw`enum Pattern { Digits = '\\d+' }`,
        name: 'should allow TypeScript enum string values',
      },
      {
        code: String.raw`import value from '.\\generated';`,
        name: 'should allow module source literals where tagged templates are illegal',
      },
      {
        code: String.raw`'use\\strict'; function run() {}`,
        name: 'should allow directive literals where conversion changes directive semantics',
      },
      {
        code: String.raw`expect(value).toMatchInlineSnapshot('value\\path');`,
        name: 'should allow Jest inline snapshot payloads',
      },
      {
        code: String.raw`const element = <Component path='C:\\repo' />;`,
        filename: 'component.tsx',
        name: 'should allow JSX attribute string values',
      },
    ],
    invalid: [
      {
        code: String.raw`const path = 'C:\\Users\\dev\\repo';`,
        name: 'should report escaped backslashes in plain string literals',
        errors: [{ messageId: 'preferStringRaw' }],
        output: ['const path = String.raw`C:', 'Users', 'dev', 'repo`;'].join(BACKSLASH),
      },
      {
        code: String.raw`const regexSource = '\\d+\\w+';`,
        name: 'should report escaped backslashes used for regex source strings',
        errors: [{ messageId: 'preferStringRaw' }],
        output: ['const regexSource = String.raw`', 'd+', 'w+`;'].join(BACKSLASH),
      },
      {
        code: String.raw`const pair = ['C:\\one', 'D:\\two'];`,
        name: 'should report each literal containing escaped backslashes',
        errors: [{ messageId: 'preferStringRaw' }, { messageId: 'preferStringRaw' }],
        output: ['const pair = [String.raw`C:', 'one`, String.raw`D:', 'two`];'].join(BACKSLASH),
      },
      {
        code: String.raw`const source = raw('C:\\Users\\dev');`,
        name: 'should report escaped backslashes when called through non-String raw helper',
        errors: [{ messageId: 'preferStringRaw' }],
        output: ['const source = raw(String.raw`C:', 'Users', 'dev`);'].join(BACKSLASH),
      },
      {
        code: String.raw`String['raw']('C:\\Users\\dev');`,
        name: 'should report escaped backslashes when String.raw is accessed via computed member',
        errors: [{ messageId: 'preferStringRaw' }],
        output: ["String['raw'](String.raw`C:", 'Users', 'dev`);'].join(BACKSLASH),
      },
      {
        code: String.raw`('C:\\Users\\dev')();`,
        name: 'should report escaped backslashes when literal is used as call callee',
        errors: [{ messageId: 'preferStringRaw' }],
        output: ['(String.raw`C:', 'Users', 'dev`)();'].join(BACKSLASH),
      },
      {
        code: String.raw`function pattern() { return'\\d+'; }`,
        name: 'should preserve keyword separation when fixing a return value',
        errors: [{ messageId: 'preferStringRaw' }],
        output: ['function pattern() { return String.raw`', 'd+`; }'].join(BACKSLASH),
      },
      {
        code: String.raw`const patterns = {['\\d+']: true};`,
        name: 'should fix computed object property keys where expressions are legal',
        errors: [{ messageId: 'preferStringRaw' }],
        output: ['const patterns = {[String.raw`', 'd+`]: true};'].join(BACKSLASH),
      },
    ],
  });
});
