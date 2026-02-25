import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noEslintDisable } from './no-eslint-disable';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
  linterOptions: {
    reportUnusedDisableDirectives: false,
  },
} as any);

ruleTester.run('no-eslint-disable', noEslintDisable, {
  valid: [
    {
      name: 'no eslint-disable comment',
      code: 'const x = 1;',
    },
    {
      name: 'regular comment without eslint-disable',
      code: '// this is just a normal comment\nconst x = 1;',
    },
    {
      name: 'block comment without eslint-disable',
      code: '/* regular block comment */\nconst x = 1;',
    },
    {
      name: 'empty file',
      code: '',
    },
    {
      name: 'comment mentioning eslint but not as a disable directive',
      code: '// see eslint docs for more info\nconst x = 1;',
    },
  ],
  invalid: [
    {
      name: 'eslint-disable block comment',
      code: '/* eslint-disable no-undef */\nconst x = 1;',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'eslint-disable-next-line comment',
      code: '// eslint-disable-next-line no-console\nconsole.log("hi");',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'eslint-disable-line comment',
      code: 'const x = 1; // eslint-disable-line no-undef',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'eslint-disable with specific rule',
      code: '/* eslint-disable no-console */\nconsole.log("hi");',
      errors: [{ messageId: 'noEslintDisable' }],
    },
    {
      name: 'multiple eslint-disable comments',
      code: '// eslint-disable-next-line no-console\nconsole.log("a");\n// eslint-disable-next-line no-console\nconsole.log("b");',
      errors: [{ messageId: 'noEslintDisable' }, { messageId: 'noEslintDisable' }],
    },
  ],
} as any);
