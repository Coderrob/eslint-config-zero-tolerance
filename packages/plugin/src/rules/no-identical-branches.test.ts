import { ruleTester } from '../test-helper';
import { noIdenticalBranches } from './no-identical-branches';

ruleTester.run('no-identical-branches', noIdenticalBranches, {
  valid: [
    {
      name: 'should allow if statement with different branches',
      code: 'if (enabled) { doA(); } else { doB(); }',
    },
    {
      name: 'should allow ternary with different branches',
      code: 'const next = ready ? getA() : getB();',
    },
    {
      name: 'should allow else-if chain without direct else branch comparison',
      code: 'if (x) { doA(); } else if (y) { doA(); }',
    },
  ],
  invalid: [
    {
      name: 'should disallow if statement with identical branches',
      code: 'if (enabled) { doA(); } else { doA(); }',
      errors: [{ messageId: 'noIdenticalBranches' }],
    },
    {
      name: 'should disallow ternary with identical branches',
      code: 'const next = ready ? getValue() : getValue();',
      errors: [{ messageId: 'noIdenticalBranches' }],
    },
  ],
});
