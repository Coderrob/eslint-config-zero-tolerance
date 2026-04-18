import { ruleTester } from '../testing/test-helper';
import { noReturnType } from './no-return-type';

ruleTester.run('no-return-type', noReturnType, {
  valid: [
    {
      code: 'type MyType = string;',
      name: 'should allow simple string type',
    },
    {
      code: 'type FactoryResult = { value: string };',
      name: 'should allow explicit named type aliases',
    },
    {
      code: 'type PromiseResult = Promise<string>;',
      name: 'should allow generic type references that are not ReturnType',
    },
  ],
  invalid: [
    {
      code: 'type MyReturnType = ReturnType<typeof myFunction>;',
      name: 'should report ReturnType usage',
      errors: [{ messageId: 'noReturnType' }],
    },
    {
      code: 'type NestedReturn = ReturnType<ReturnType<typeof factory>>;',
      name: 'should report nested ReturnType usage',
      errors: [{ messageId: 'noReturnType' }, { messageId: 'noReturnType' }],
    },
    {
      code: 'type Combined = ReturnType<typeof fn> | string;',
      name: 'should report ReturnType in union',
      errors: [{ messageId: 'noReturnType' }],
    },
  ],
});
