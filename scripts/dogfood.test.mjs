import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ESLint } from 'eslint';

const RULE_NAMES = [
  'no-array-mutation',
  'no-query-side-effects',
  'no-identical-expressions',
  'require-timeout-for-io',
  'no-await-in-loop',
  'max-function-lines',
  'require-error-cause',
];
const ERROR_SEVERITY = 2;
const TYPESCRIPT_MAX_LINES = 15;
const OVER_LIMIT_LINES = 31;

// Use real repository paths so tests exercise the final merged flat configuration.
const SOURCE_PATHS = [
  'packages/plugin/src/rules/support/timeout-value.ts',
  'scripts/validate-rule-naming.mjs',
];

describe('repository dogfooding', () => {
  test('should enable all updated rules on production TypeScript and scripts', async () => {
    const eslint = new ESLint();
    const configs = await Promise.all(
      SOURCE_PATHS.map((file) => eslint.calculateConfigForFile(file)),
    );
    for (const config of configs) {
      for (const name of RULE_NAMES) {
        assert.equal(config.rules[`zero-tolerance/${name}`][0], ERROR_SEVERITY, name);
      }
    }
    assert.equal(
      configs[0].rules['zero-tolerance/max-function-lines'][1].max,
      TYPESCRIPT_MAX_LINES,
    );
  });

  test('should report representative violations through the repository script configuration', async () => {
    const eslint = new ESLint();
    const code = [
      'const items = []; items.push(1);',
      'function getValue(value) { value.count++; return value; }',
      'const repeated = value === value;',
      'fetch(url);',
      'async function run() { while (pending) { await work(); } }',
      'try { work(); } catch (error) { throw new Error("failed"); }',
      'function lengthy() {',
      ...Array.from({ length: OVER_LIMIT_LINES }, () => 'work();'),
      '}',
    ].join('\n');
    const [result] = await eslint.lintText(code, { filePath: SOURCE_PATHS[1] });
    const reported = new Set(result.messages.map((message) => message.ruleId));
    assert.equal(result.fatalErrorCount, 0);
    for (const name of RULE_NAMES) assert.ok(reported.has(`zero-tolerance/${name}`), name);
  });

  test('should retain test-specific exemptions without disabling other updated rules', async () => {
    const eslint = new ESLint();
    const config = await eslint.calculateConfigForFile('scripts/dogfood.test.mjs');
    assert.equal(config.rules['zero-tolerance/max-function-lines'][0], 0);
    for (const name of RULE_NAMES.filter((name) => name !== 'max-function-lines')) {
      assert.equal(config.rules[`zero-tolerance/${name}`][0], ERROR_SEVERITY, name);
    }
  });
});
