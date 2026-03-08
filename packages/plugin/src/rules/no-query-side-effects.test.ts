import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { noQuerySideEffects } from './no-query-side-effects';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-query-side-effects', noQuerySideEffects, {
  valid: [
    {
      name: 'should allow pure get function',
      code: 'function getName(user: {name: string}) { return user.name; }',
    },
    {
      name: 'should allow modifier function with assignment',
      code: 'function updateName(user: {name: string}) { user.name = "x"; }',
    },
    {
      name: 'should allow query function with nested modifier function side effect',
      code: 'function getResult() { function update() { count++; } return 1; }',
    },
    {
      name: 'should allow non-mutating method call in query function',
      code: 'function getResult(list: string[]) { return list.slice(0).join(","); }',
    },
    {
      name: 'should allow direct call expression in query function',
      code: 'function getResult() { return compute(); }',
    },
    {
      name: 'should allow non-delete unary expression in query function',
      code: 'function getCount(value: number) { return -value; }',
    },
  ],
  invalid: [
    {
      name: 'should disallow assignment in get function',
      code: 'function getCount() { total = total + 1; return total; }',
      errors: [{ messageId: 'noQuerySideEffects', data: { name: 'getCount', kind: 'assignment' } }],
    },
    {
      name: 'should disallow update expression in is function',
      code: 'const isReady = () => { counter++; return true; };',
      errors: [{ messageId: 'noQuerySideEffects', data: { name: 'isReady', kind: 'update' } }],
    },
    {
      name: 'should disallow mutating method call in has function',
      code: 'function hasItems(list: string[]) { list.push("x"); return list.length > 0; }',
      errors: [
        {
          messageId: 'noQuerySideEffects',
          data: { name: 'hasItems', kind: 'mutating call "push"' },
        },
      ],
    },
    {
      name: 'should disallow delete in can function',
      code: 'function canProceed(state: {ok?: boolean}) { delete state.ok; return true; }',
      errors: [{ messageId: 'noQuerySideEffects', data: { name: 'canProceed', kind: 'delete' } }],
    },
  ],
});
