import * as tsParser from '@typescript-eslint/parser';
import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { noEslintDisable } from './no-eslint-disable';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parser: tsParser,
  },
  linterOptions: {
    reportUnusedDisableDirectives: false,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('no-eslint-disable', noEslintDisable, {
  valid: [
    {
      name: 'should allow file without eslint-disable comment',
      code: 'const x = 1;',
    },
    {
      name: 'should allow regular comment without eslint-disable',
      code: '// this is just a normal comment\nconst x = 1;',
    },
    {
      name: 'should allow block comment without eslint-disable',
      code: '/* regular block comment */\nconst x = 1;',
    },
    {
      name: 'should allow empty file',
      code: '',
    },
    {
      name: 'should allow comment mentioning eslint without disable directive',
      code: '// see eslint docs for more info\nconst x = 1;',
    },
  ],
  invalid: [
    {
      name: 'should report eslint-disable block comment',
      code: '/* eslint-disable no-undef */\nconst x = 1;',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'should report eslint-disable-next-line comment',
      code: '// eslint-disable-next-line no-console\nconsole.log("hi");',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'should report eslint-disable-line comment',
      code: 'const x = 1; // eslint-disable-line no-undef',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'should report eslint-disable with specific rule',
      code: '/* eslint-disable no-console */\nconsole.log("hi");',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'should report multiple eslint-disable comments',
      code: '// eslint-disable-next-line no-console\nconsole.log("a");\n// eslint-disable-next-line no-console\nconsole.log("b");',
      errors: [{ messageId: 'noEslintDisable' }, { messageId: 'noEslintDisable' }],
    },
  ],
});
