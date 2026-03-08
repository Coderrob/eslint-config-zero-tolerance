import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { requireOptionalChaining } from './require-optional-chaining';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('require-optional-chaining', requireOptionalChaining, {
  valid: [
    {
      name: 'should allow optional chaining when already used',
      code: 'const value = user?.profile;',
    },
    {
      name: 'should allow logical or expression',
      code: 'const value = user || user.profile;',
    },
    {
      name: 'should allow unrelated guard and access expressions',
      code: 'const value = user && account.profile;',
    },
    {
      name: 'should allow right side that is not member or call access',
      code: 'const value = user && hasProfile;',
    },
    {
      name: 'should allow guard that is a call expression',
      code: 'const value = getUser() && getUser().profile;',
    },
    {
      name: 'should allow right side with optional call',
      code: 'const value = fn && fn?.();',
    },
    {
      name: 'should allow right side that equals guard expression',
      code: 'const value = user && user;',
    },
    {
      name: 'should allow right side with similar identifier prefix',
      code: 'const value = user && userProfile.name;',
    },
    {
      name: 'should allow guard that is a type assertion expression',
      code: 'const value = (getUser() as User) && getUser().profile;',
    },
    {
      name: 'should allow computed guard access with side-effecting key',
      code: 'const value = obj[getKey()] && obj[getKey()].value;',
    },
    {
      name: 'should allow computed guard access with non-safe literal key',
      code: 'const value = obj[true] && obj[true].value;',
    },
  ],
  invalid: [
    {
      name: 'should require optional chaining for property access',
      code: 'const value = user && user.profile;',
      output: 'const value = user?.profile;',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for computed property access',
      code: "const value = user && user['profile'];",
      output: "const value = user?.['profile'];",
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for direct function call',
      code: 'const value = fn && fn();',
      output: 'const value = fn?.();',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for method calls',
      code: 'const value = service && service.run();',
      output: 'const value = service?.run();',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for member guards',
      code: 'const value = user.profile && user.profile.name;',
      output: 'const value = user.profile?.name;',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for member function guards',
      code: 'const value = service.client && service.client();',
      output: 'const value = service.client?.();',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for parenthesized guards',
      code: 'const value = (user) && user.profile;',
      output: 'const value = user?.profile;',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for asserted member guards',
      code: 'const value = (user as User) && user.profile;',
      output: 'const value = user?.profile;',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
    {
      name: 'should require optional chaining for numeric literal computed access',
      code: 'const value = arr && arr[0];',
      output: 'const value = arr?.[0];',
      errors: [{ messageId: 'useOptionalChaining' }],
    },
  ],
});
