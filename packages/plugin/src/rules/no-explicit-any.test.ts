import { ruleTester } from '../testing/test-helper';
import { noExplicitAny } from './no-explicit-any';

ruleTester.run('no-explicit-any', noExplicitAny, {
  valid: [
    {
      name: 'should allow unknown annotations',
      code: 'const payload: unknown = input;',
    },
    {
      name: 'should allow constrained generics',
      code: 'function identity<T>(value: T): T { return value; }',
    },
    {
      name: 'should allow object types with explicit properties',
      code: 'type Payload = { id: string; nested: { ready: boolean } };',
    },
  ],
  invalid: [
    {
      name: 'should disallow any in function parameters',
      code: 'function read(value: any): string { return String(value); }',
      errors: [{ messageId: 'noExplicitAny' }],
    },
    {
      name: 'should disallow any in type aliases',
      code: 'type Payload = any;',
      errors: [{ messageId: 'noExplicitAny' }],
    },
    {
      name: 'should disallow any in generic type arguments',
      code: 'const values: Array<any> = [];',
      errors: [{ messageId: 'noExplicitAny' }],
    },
  ],
});
