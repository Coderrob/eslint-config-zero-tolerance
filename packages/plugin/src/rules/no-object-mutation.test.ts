import { ruleTester } from '../test-helper';
import { noObjectMutation } from './no-object-mutation';

ruleTester.run('no-object-mutation', noObjectMutation, {
  valid: [
    {
      name: 'should allow creating a new object with spread',
      code: 'const next = { ...state, count: state.count + 1 };',
    },
    {
      name: 'should allow local variable reassignment',
      code: 'count = count + 1;',
    },
    {
      name: 'should allow unary expression that is not delete',
      code: 'const value = -count;',
    },
    {
      name: 'should allow update expression on identifier',
      code: 'count++;',
    },
    {
      name: 'should allow constructor assignment to this fields',
      code: `
        class AppError extends Error {
          context?: Record<string, unknown>;

          constructor(message: string, context?: Record<string, unknown>) {
            super(message);
            this.name = this.constructor.name;
            this.context = context;
          }
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'should disallow assignment to object property',
      code: 'state.count = 1;',
      errors: [{ messageId: 'noObjectMutation', data: { kind: 'assignment' } }],
    },
    {
      name: 'should disallow update on object property',
      code: 'state.count++;',
      errors: [{ messageId: 'noObjectMutation', data: { kind: 'update' } }],
    },
    {
      name: 'should disallow delete on object property',
      code: 'delete state.count;',
      errors: [{ messageId: 'noObjectMutation', data: { kind: 'delete' } }],
    },
    {
      name: 'should disallow computed property assignment',
      code: "state['count'] = 1;",
      errors: [{ messageId: 'noObjectMutation', data: { kind: 'assignment' } }],
    },
    {
      name: 'should disallow assignment to this field outside constructor',
      code: 'class Counter { count = 0; increment() { this.count = this.count + 1; } }',
      errors: [{ messageId: 'noObjectMutation', data: { kind: 'assignment' } }],
    },
  ],
});
