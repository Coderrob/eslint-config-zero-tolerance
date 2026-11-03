import { ruleTester } from '../testing/test-helper';
import { noQuerySideEffects } from './no-query-side-effects';

describe('no-query-side-effects', () => {
  ruleTester.run('no-query-side-effects', noQuerySideEffects, {
    valid: [
      {
        name: 'should allow asserted fresh array construction',
        code: 'function getList() { const list = [] as number[]; list.push(1); return list; }',
      },
      {
        name: 'should allow satisfies fresh object construction',
        code: 'function getResult() { const result = { value: 0 } satisfies { value: number }; result.value = 1; return result; }',
      },
      {
        name: 'should allow angle asserted fresh array construction',
        code: 'function getList() { const list = <number[]>[]; list.push(1); return list; }',
      },
      {
        name: 'should allow nonnull fresh object construction',
        code: 'function getResult() { const result = ({ value: 0 })!; result.value++; return result; }',
      },
      {
        name: 'should allow optional computed local array mutation',
        code: 'function getList() { const list = []; list?.["push"]?.(1); return list; }',
      },
      {
        name: 'should allow local shadowing of outer state',
        code: 'let count = 0; function getCount() { let count = 1; count++; return count; }',
      },
      {
        name: 'should allow computed data writes with unrelated accessor',
        code: 'function getResult() { const result = { set other(value) { external = value; }, value: 0 }; result["value"] = 1; return result; }',
      },
      {
        name: 'should allow containers recreated per iteration',
        code: 'function getItems(values) { for (const value of values) { const result = []; result.push(value); publish(result); } }',
      },
      {
        name: 'should allow containers published after the loop',
        code: 'function getItems(values) { const result = []; for (const value of values) { result.push(value); } publish(result); return result; }',
      },
      {
        name: 'should allow per-iteration object writes',
        code: 'function getItems(values) { for (const value of values) { const result = {}; result.value = value; publish(result); } }',
      },
      {
        name: 'should allow containers recreated in nested loops',
        code: 'function getItems(values) { for (const group of values) { for (const value of group) { const result = []; result.push(value); publish(result); } } }',
      },
      {
        name: 'should allow later escapes outside loops',
        code: 'function getItems() { const result = []; result.push(1); publish(result); return result; }',
      },
      {
        name: 'should allow deleting a local accessor without invoking it',
        code: 'function getValue() { const local = { set value(v) { shared.value = v; } }; delete local.value; return local; }',
      },
      {
        name: 'should allow writes to unrelated data properties',
        code: 'function getValue() { const local = { set value(v) { shared.value = v; } }; local.other = 1; return local; }',
      },
      {
        name: 'should allow writes beside static computed accessors',
        code: 'function getValue() { const local = { set ["value"](v) { shared.value = v; } }; local.other = 1; return local; }',
      },
      {
        name: 'should allow local data properties copied with spread',
        code: 'function getValue(input) { const local = { ...input }; local.value = 1; return local; }',
      },
      {
        name: 'should allow local counters',
        code: 'function getTotal() { let total = 0; total += 1; total++; return total; }',
      },
      {
        name: 'should allow local array building',
        code: 'function getItems() { const items = []; items.push(1); return items; }',
      },
      {
        name: 'should allow local object construction',
        code: 'function getValue() { const result = {}; result.value = 1; delete result.value; return result; }',
      },
      {
        name: 'should allow block-local computation',
        code: 'function getTotal() { if (flag) { let n = 0; n++; return n; } }',
      },
      {
        name: 'should allow local parameter rebinding',
        code: 'function getValue(value) { value = 1; return value; }',
      },
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
      {
        name: 'should allow top-level side effect outside any query function scope',
        code: 'counter = counter + 1;',
      },
    ],
    invalid: [
      {
        name: 'should reject asserted aliases of shared objects',
        code: 'function getResult(shared) { const result = shared as { value: number }; result.value++; return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should retain publication checks for asserted fresh arrays',
        code: 'function getList() { const list = [] as number[]; publish(list); list.push(1); return list; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should retain accessor checks through assertions',
        code: 'function getResult() { const result = ({ set value(next) { external = next; } }) as { value: number }; result.value = 1; return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should retain loop publication checks for asserted arrays',
        code: 'function getList() { const list = [] as number[]; for (const item of items) { list.push(item); publish(list); } return list; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report optional computed shared mutation',
        code: 'function getList(list) { list?.["push"]?.(1); return list; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report mutation through asserted shared receiver',
        code: 'function getList(list) { (list as number[]).push(1); return list; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report computed local setter effects',
        code: 'function getResult() { const result = { set value(next) { external = next; } }; result["value"] = 1; return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report escaped local array optional mutation',
        code: 'function getList() { const list = []; publish(list); list?.push?.(1); return list; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report reused arrays published within for-of loops',
        code: 'function getItems(values) { const result = []; for (const value of values) { result.push(value); publish(result); } return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report escapes in while loops',
        code: 'function getItems() { const result = []; while (more()) { result.push(1); publish(result); } return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report escapes in do-while loops',
        code: 'function getItems() { const result = []; do { result.push(1); publish(result); } while (more()); return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report escapes in for-in loops',
        code: 'function getItems(values) { const result = []; for (const key in values) { result.push(key); publish(result); } return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report escapes from for initializer allocations',
        code: 'function getItems() { for (const result = []; more();) { result.push(1); publish(result); } }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report inner-loop escapes of outer-body allocations',
        code: 'function getItems(values) { for (const group of values) { const result = []; for (const value of group) { result.push(value); publish(result); } } }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report reused objects published within loops',
        code: 'function getItems(values) { const result = {}; for (const value of values) { result.value = value; publish(result); } return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report conditional later publications',
        code: 'function getItems(values) { const result = []; for (const value of values) { result.push(value); if (ready) publish(result); } return result; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report setters on fresh local objects',
        code: 'function getValue() { const local = { set value(v) { shared.value = v; } }; local.value = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report quoted setter names',
        code: 'function getValue() { const local = { set "value"(v) { shared.value = v; } }; local["value"] = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report computed setter names',
        code: 'function getValue() { const local = { set [key](v) { shared.value = v; } }; local.value = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report static computed setters',
        code: 'function getValue() { const local = { set ["value"](v) { shared.value = v; } }; local.value++; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report dynamic writes when an accessor may match',
        code: 'function getValue(key) { const local = { set value(v) { shared.value = v; } }; local[key] = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report arbitrary mutator methods on local objects',
        code: 'function getValue() { const actions = { set: writeToDatabase }; actions.set(); }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report mutation through an argument alias',
        code: 'function getValue(input) { const alias = input; alias.x = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report closure state changes',
        code: 'let count = 0; function getValue() { count++; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report nested shared properties',
        code: 'function getValue(input) { const local = { input }; local.input.x = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report escaped containers',
        code: 'function getValue() { const local = {}; publish(local); local.x = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report captured containers',
        code: 'function getValue() { const local = {}; const read = () => local; local.x = 1; }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should report destructuring into shared state',
        code: 'function getValue(input) { ({ x: shared } = input); }',
        errors: [{ messageId: 'noQuerySideEffects' }],
      },
      {
        name: 'should disallow assignment in get function',
        code: 'function getCount() { total = total + 1; return total; }',
        errors: [
          { messageId: 'noQuerySideEffects', data: { name: 'getCount', kind: 'assignment' } },
        ],
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
});
