import { ruleTester } from '../testing/test-helper';
import { noDestructuredParameterTypeLiteral } from './no-destructured-parameter-type-literal';

ruleTester.run('no-destructured-parameter-type-literal', noDestructuredParameterTypeLiteral, {
  valid: [
    {
      code: `
          interface IUiActions {
            readonly set: UiStateSetter;
          }

          function update({ set }: IUiActions): void {
            set('ready');
          }
        `,
      name: 'should allow destructured parameters typed with a named interface',
    },
    {
      code: `
          type UiActions = Readonly<{ readonly set: UiStateSetter }>;

          const update = ({ set }: UiActions): void => {
            set('ready');
          };
        `,
      name: 'should allow destructured parameters typed with a named alias',
    },
    {
      code: `
          function update(actions: Readonly<{ readonly set: UiStateSetter }>): void {
            actions.set('ready');
          }
        `,
      name: 'should allow inline object type literals on non-destructured parameters',
    },
    {
      code: `
          function update({ set }): void {
            set('ready');
          }
        `,
      name: 'should allow destructured parameters without a type annotation',
    },
    {
      code: `
          function update({ set } = defaults): void {
            set('ready');
          }
        `,
      name: 'should allow destructured assignment parameters without a type annotation',
    },
    {
      code: `
          function update(options = defaults): void {
            void options;
          }
        `,
      name: 'should allow assignment parameters whose left side is not an object pattern',
    },
    {
      code: `
          type IOptions = Readonly<{ readonly set: UiStateSetter }>;

          function update({ set }: Readonly<IOptions> = defaults): void {
            set('ready');
          }
        `,
      name: 'should allow destructured assignment parameters typed with a named type',
    },
  ],
  invalid: [
    {
      code: `
          function update({ set }: { readonly set: UiStateSetter }): void {
            set('ready');
          }
        `,
      name: 'should report destructured parameters with a direct inline object type literal',
      errors: [{ messageId: 'noDestructuredParameterTypeLiteral' }],
    },
    {
      code: `
          function update({ set }: Readonly<{ set: UiStateSetter }>): void {
            set('ready');
          }
        `,
      name: 'should report destructured parameters with a readonly wrapped inline object type literal',
      errors: [{ messageId: 'noDestructuredParameterTypeLiteral' }],
    },
    {
      code: `
          const update = ({ set }: Readonly<{ readonly set: UiStateSetter }> & AuditTrail): void => {
            set('ready');
          };
        `,
      name: 'should report destructured parameters when an inline object type literal appears inside a compound type',
      errors: [{ messageId: 'noDestructuredParameterTypeLiteral' }],
    },
    {
      code: `
          function update(
            { set }: Readonly<{ set: UiStateSetter }> = defaults,
          ): void {
            set('ready');
          }
        `,
      name: 'should report destructured assignment parameters with an inline object type literal',
      errors: [{ messageId: 'noDestructuredParameterTypeLiteral' }],
    },
  ],
});
