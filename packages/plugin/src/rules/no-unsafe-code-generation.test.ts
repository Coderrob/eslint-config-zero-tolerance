import { ruleTester } from '../testing/test-helper';
import { noUnsafeCodeGeneration } from './no-unsafe-code-generation';

ruleTester.run('no-unsafe-code-generation', noUnsafeCodeGeneration, {
  valid: [
    {
      name: 'should allow function timer callback',
      code: 'setTimeout(() => run(), 100);',
    },
    {
      name: 'should allow non string timer callback',
      code: 'setInterval(handler, 100);',
    },
    {
      name: 'should allow shadowed Function identifier',
      code: 'function build(Function: (value: string) => string): string { return Function(value); }',
    },
    {
      name: 'should allow shadowed eval identifier',
      code: 'function build(eval: (value: string) => string): string { return eval(value); }',
    },
    {
      name: 'should allow timer calls without callback arguments',
      code: 'setTimeout();',
    },
    {
      name: 'should allow non execution vm namespace members',
      code: "import * as vm from 'node:vm'; vm.createContext({});",
    },
    {
      name: 'should allow unrelated imports with vm-like names',
      code: "import { runInContext } from 'not-vm'; runInContext(source);",
    },
    {
      name: 'should allow dynamic vm-like member calls',
      code: '(getVm()).runInContext(source);',
    },
  ],
  invalid: [
    {
      name: 'should report eval calls',
      code: 'eval(source);',
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report global eval calls',
      code: 'global.eval(source);',
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report new Function constructor',
      code: 'const fn = new Function(source);',
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report Function calls',
      code: 'const fn = Function(source);',
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report string timer callbacks',
      code: "setTimeout('run()', 100);",
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report vm namespace calls',
      code: "import * as vm from 'node:vm'; vm.runInNewContext(source);",
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report imported vm aliases',
      code: "import { runInThisContext as run } from 'vm'; run(source);",
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report vm script constructors',
      code: "import * as vm from 'node:vm'; new vm.Script(source);",
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
    {
      name: 'should report imported vm script aliases',
      code: "import { Script } from 'vm'; new Script(source);",
      errors: [{ messageId: 'unsafeCodeGeneration' }],
    },
  ],
});
