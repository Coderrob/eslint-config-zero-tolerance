import { ruleTester } from '../testing/test-helper';
import { noTsNocheck } from './no-ts-nocheck';

ruleTester.run('no-ts-nocheck', noTsNocheck, {
  valid: [
    {
      name: 'should allow file without TypeScript directive comments',
      code: 'const value = 1;',
    },
    {
      name: 'should allow ts-check comments',
      code: '// @ts-check\nconst value = 1;',
    },
    {
      name: 'should allow ts-expect-error comments',
      code: '// @ts-expect-error intentional negative test\nconst value: string = 1;',
    },
    {
      name: 'should allow comments mentioning ts-nocheck without directive syntax',
      code: '// avoid using ts-nocheck in source files\nconst value = 1;',
    },
  ],
  invalid: [
    {
      name: 'should report ts-nocheck line comment',
      code: '// @ts-nocheck\nconst value = 1;',
      errors: [{ messageId: 'noTsNocheck' }],
    },
    {
      name: 'should report ts-nocheck block comment',
      code: '/* @ts-nocheck */\nconst value = 1;',
      errors: [{ messageId: 'noTsNocheck' }],
    },
    {
      name: 'should report ts-nocheck with trailing explanation',
      code: '// @ts-nocheck legacy migration\nconst value = 1;',
      errors: [{ messageId: 'noTsNocheck' }],
    },
  ],
});
