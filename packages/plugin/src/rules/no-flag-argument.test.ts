import { ruleTester } from '../test-helper';
import { noFlagArgument } from './no-flag-argument';

ruleTester.run('no-flag-argument', noFlagArgument, {
  valid: [
    {
      name: 'should allow non-boolean parameter',
      code: 'function buildUser(name: string) { return name; }',
    },
    {
      name: 'should allow options object parameter',
      code: 'function buildUser(options: { isAdmin: boolean }) { return options; }',
    },
    {
      name: 'should allow untyped parameter',
      code: 'function buildUser(flag) { return flag; }',
    },
    {
      name: 'should allow destructured boolean parameter object',
      code: 'function buildUser({ enabled }: { enabled: boolean }) { return enabled; }',
    },
    {
      name: 'should allow defaulted destructured parameter object',
      code: 'function buildUser({ enabled } = { enabled: false }) { return enabled; }',
    },
  ],
  invalid: [
    {
      name: 'should disallow boolean parameter in function declaration',
      code: 'function render(verbose: boolean) { return verbose; }',
      errors: [{ messageId: 'noFlagArgument', data: { name: 'verbose' } }],
    },
    {
      name: 'should disallow boolean parameter in arrow function',
      code: 'const run = (dryRun: boolean) => dryRun;',
      errors: [{ messageId: 'noFlagArgument', data: { name: 'dryRun' } }],
    },
    {
      name: 'should disallow boolean defaulted parameter',
      code: 'function save(force: boolean = false) { return force; }',
      errors: [{ messageId: 'noFlagArgument', data: { name: 'force' } }],
    },
  ],
});
