import { ruleTester } from '../testing/test-helper';
import { noShellCommandConstruction } from './no-shell-command-construction';

ruleTester.run('no-shell-command-construction', noShellCommandConstruction, {
  valid: [
    {
      name: 'should allow spawn with argument vector',
      code: "import { spawn } from 'node:child_process'; spawn('git', ['status']);",
    },
    {
      name: 'should allow execFile with literal executable and args',
      code: "import { execFile } from 'child_process'; execFile('git', ['status']);",
    },
    {
      name: 'should allow approved shell wrapper',
      code: "safeExec(`git ${branch}`);",
      options: [{ approvedWrapperNames: ['safeExec'] }],
    },
    {
      name: 'should allow regex exec methods',
      code: 'const match = pattern.exec(value);',
    },
    {
      name: 'should allow spawn without arguments as unresolved direct call',
      code: 'spawn();',
    },
    {
      name: 'should allow unrelated imports',
      code: "import { exec } from 'not-child-process'; const value = 1;",
    },
    {
      name: 'should allow dynamic member exec calls',
      code: '(getProcess()).exec(command);',
    },
  ],
  invalid: [
    {
      name: 'should report imported exec',
      code: "import { exec } from 'node:child_process'; exec(command);",
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report imported exec sync',
      code: "import { execSync } from 'child_process'; execSync(command);",
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report interpolated spawn command',
      code: "import { spawn } from 'node:child_process'; spawn(`git ${cmd}`, []);",
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report concatenated spawn command',
      code: "import { spawn } from 'node:child_process'; spawn('git ' + cmd, []);",
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report spawn shell option',
      code: "import { spawn } from 'node:child_process'; spawn('git', ['status'], { shell: true });",
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report namespace exec calls',
      code: "import * as cp from 'child_process'; cp.exec(command);",
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report namespace spawn shell option',
      code: "import * as cp from 'child_process'; cp.spawn('git', ['status'], { shell: true });",
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report execa command calls',
      code: 'execa.command(command);',
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
    {
      name: 'should report direct exec calls without imports',
      code: 'exec(command);',
      errors: [{ messageId: 'shellCommandConstruction' }],
    },
  ],
});
