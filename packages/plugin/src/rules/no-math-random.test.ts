import { ruleTester } from '../testing/test-helper';
import { noMathRandom } from './no-math-random';

ruleTester.run('no-math-random', noMathRandom, {
  valid: [
    {
      name: 'should allow injected random generators',
      code: 'const value = rng.nextFloat();',
    },
    {
      name: 'should allow computed Math random access',
      code: 'const random = Math["random"]();',
    },
    {
      name: 'should allow other Math methods',
      code: 'const rounded = Math.round(value);',
    },
  ],
  invalid: [
    {
      name: 'should disallow direct Math.random calls',
      code: 'const value = Math.random();',
      errors: [{ messageId: 'noMathRandom' }],
    },
    {
      name: 'should disallow Math.random in arithmetic expressions',
      code: 'const id = Math.floor(Math.random() * 10);',
      errors: [{ messageId: 'noMathRandom' }],
    },
  ],
});
