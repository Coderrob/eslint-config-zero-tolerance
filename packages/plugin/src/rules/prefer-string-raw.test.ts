import { ruleTester } from '../testing/test-helper';
import { preferStringRaw } from './prefer-string-raw';

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
      code: "const quote = 'it\\'s done';",
      name: 'should allow literals that only escape quote characters',
    },
    {
      code: 'const path = String.raw`C:\\Users\\dev\\repo`;',
      name: 'should allow String.raw tagged templates',
    },
    {
      code: "const source = String.raw('C:\\\\Users\\\\dev');",
      name: 'should allow literals passed directly to String.raw()',
    },
  ],
  invalid: [
    {
      code: "const path = 'C:\\\\Users\\\\dev\\\\repo';",
      name: 'should report escaped backslashes in plain string literals',
      errors: [{ messageId: 'preferStringRaw' }],
      output: 'const path = String.raw`C:\\Users\\dev\\repo`;',
    },
    {
      code: "const regexSource = '\\\\d+\\\\w+';",
      name: 'should report escaped backslashes used for regex source strings',
      errors: [{ messageId: 'preferStringRaw' }],
      output: 'const regexSource = String.raw`\\d+\\w+`;',
    },
    {
      code: "const pair = ['C:\\\\one', 'D:\\\\two'];",
      name: 'should report each literal containing escaped backslashes',
      errors: [{ messageId: 'preferStringRaw' }, { messageId: 'preferStringRaw' }],
      output: 'const pair = [String.raw`C:\\one`, String.raw`D:\\two`];',
    },
    {
      code: "const source = raw('C:\\\\Users\\\\dev');",
      name: 'should report escaped backslashes when called through non-String raw helper',
      errors: [{ messageId: 'preferStringRaw' }],
      output: 'const source = raw(String.raw`C:\\Users\\dev`);',
    },
    {
      code: "String['raw']('C:\\\\Users\\\\dev');",
      name: 'should report escaped backslashes when String.raw is accessed via computed member',
      errors: [{ messageId: 'preferStringRaw' }],
      output: "String['raw'](String.raw`C:\\Users\\dev`);",
    },
    {
      code: "('C:\\\\Users\\\\dev')();",
      name: 'should report escaped backslashes when literal is used as call callee',
      errors: [{ messageId: 'preferStringRaw' }],
      output: '(String.raw`C:\\Users\\dev`)();',
    },
    {
      code: "const source = 'C:\\\\${name}';",
      name: 'should report without autofixing literals containing template interpolation markers',
      errors: [{ messageId: 'preferStringRaw' }],
      output: null,
    },
  ],
});
