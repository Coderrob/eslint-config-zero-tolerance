import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { requireOptionalChaining } from './require-optional-chaining';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

ruleTester.run('require-optional-chaining', requireOptionalChaining, {
  valid: [
    {
      name: 'should pass when optional chaining is already used',
      code: 'const value = user?.profile;',
    },
    {
      name: 'should pass when using logical or expression',
      code: 'const value = user || user.profile;',
    },
    {
      name: 'should pass when guard and access are unrelated',
      code: 'const value = user && account.profile;',
    },
    {
      name: 'should pass when right side is not member or call access',
      code: 'const value = user && hasProfile;',
    },
    {
      name: 'should pass when guard is a call expression',
      code: 'const value = getUser() && getUser().profile;',
    },
    {
      name: 'should pass when right side already contains optional call',
      code: 'const value = fn && fn?.();',
    },
    {
      name: 'should pass when right side is the same guard expression',
      code: 'const value = user && user;',
    },
    {
      name: 'should pass when right side starts with similar identifier',
      code: 'const value = user && userProfile.name;',
    },
    {
      name: 'should pass when guard is type assertion expression',
      code: 'const value = (getUser() as User) && getUser().profile;',
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
  ],
} as any);
