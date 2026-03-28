import { ruleTester } from '../test-helper';
import { noArrayMutation } from './no-array-mutation';

ruleTester.run('no-array-mutation', noArrayMutation, {
  valid: [
    {
      name: 'should allow non-mutating slice call',
      code: 'const out = items.slice(0);',
    },
    {
      name: 'should allow non-member call expression',
      code: 'mutate(items);',
    },
    {
      name: 'should allow unknown member method',
      code: 'items.map((value) => value + 1);',
    },
    {
      name: 'should allow computed member with non-mutating name',
      code: "items['map']((value) => value + 1);",
    },
  ],
  invalid: [
    {
      name: 'should disallow push mutation',
      code: 'items.push(value);',
      errors: [{ messageId: 'noArrayMutation', data: { method: 'push' } }],
    },
    {
      name: 'should disallow sort mutation',
      code: 'items.sort();',
      errors: [{ messageId: 'noArrayMutation', data: { method: 'sort' } }],
    },
    {
      name: 'should disallow splice mutation via computed member',
      code: "items['splice'](0, 1);",
      errors: [{ messageId: 'noArrayMutation', data: { method: 'splice' } }],
    },
    {
      name: 'should disallow reverse mutation',
      code: 'items.reverse();',
      errors: [{ messageId: 'noArrayMutation', data: { method: 'reverse' } }],
    },
  ],
});
