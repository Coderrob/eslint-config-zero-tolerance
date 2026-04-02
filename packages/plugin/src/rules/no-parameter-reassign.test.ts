import { ruleTester } from '../testing/test-helper';
import { noParameterReassign } from './no-parameter-reassign';

ruleTester.run('no-parameter-reassign', noParameterReassign, {
  valid: [
    {
      name: 'should allow reading parameter without reassignment',
      code: 'function f(value: number) { return value + 1; }',
    },
    {
      name: 'should allow assigning to a new local variable',
      code: 'function f(value: number) { let next = value; next += 1; return next; }',
    },
    {
      name: 'should allow assigning to object property from parameter',
      code: 'function f(value: {count: number}) { value.count = 1; }',
    },
    {
      name: 'should allow updating object property from parameter',
      code: 'function f(value: {count: number}) { value.count++; }',
    },
    {
      name: 'should allow destructured object parameter without reassignment',
      code: 'function f({ value }: { value: number }) { return value; }',
    },
    {
      name: 'should allow nested function reusing same identifier name',
      code: 'function f(value: number) { function g(value: number) { return value + 1; } return g(value); }',
    },
    {
      name: 'should allow assignment pattern with destructured left parameter',
      code: 'function f({ value } = { value: 1 }) { return value; }',
    },
    {
      name: 'should allow rest parameter with array pattern argument',
      code: 'function f(...[first]: string[]) { return first; }',
    },
  ],
  invalid: [
    {
      name: 'should disallow direct assignment to parameter',
      code: 'function f(value: number) { value = value + 1; return value; }',
      errors: [{ messageId: 'noParameterReassign', data: { name: 'value' } }],
    },
    {
      name: 'should disallow update expression on parameter',
      code: 'function f(count: number) { count++; return count; }',
      errors: [{ messageId: 'noParameterReassign', data: { name: 'count' } }],
    },
    {
      name: 'should disallow assignment to default parameter identifier',
      code: 'function f(value = 1) { value = 2; return value; }',
      errors: [{ messageId: 'noParameterReassign', data: { name: 'value' } }],
    },
    {
      name: 'should disallow reassignment of rest parameter',
      code: 'function f(...items: string[]) { items = []; return items.length; }',
      errors: [{ messageId: 'noParameterReassign', data: { name: 'items' } }],
    },
  ],
});
