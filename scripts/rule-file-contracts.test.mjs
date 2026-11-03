import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import parser from '@typescript-eslint/parser';
import { ESLint } from 'eslint';
import plugin from '../packages/plugin/dist/index.mjs';

const FIXTURE_ROOT = new URL('../test/consumers/rule-contracts/', import.meta.url);
const CONTRACTS = JSON.parse(readFileSync(new URL('cases.json', FIXTURE_ROOT), 'utf8'));
const ERROR_SEVERITY = 2;

/**
 * Creates an isolated configuration against the built plugin for a file contract.
 * @param contract - Rule name, options, and expected diagnostic.
 * @returns ESLint instance that checks the actual fixture files.
 */
function contractLinter(contract) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: { parser },
        plugins: { 'zero-tolerance': plugin },
        rules: { [`zero-tolerance/${contract.rule}`]: ['error', ...(contract.options ?? [])] },
      },
    ],
  });
}

describe('built plugin file contracts', () => {
  for (const contract of CONTRACTS) {
    test(`should report the exact ${contract.rule} violation in its invalid file`, async () => {
      const file = fileURLToPath(new URL(`${contract.rule}/invalid.ts`, FIXTURE_ROOT));
      const results = await contractLinter(contract).lintFiles([file]);
      assert.equal(results.length, 1);
      assert.equal(results[0].fatalErrorCount, 0);
      assert.deepEqual(
        results[0].messages.map(({ ruleId, messageId, line, severity }) => ({
          ruleId,
          messageId,
          line,
          severity,
        })),
        [
          {
            ruleId: `zero-tolerance/${contract.rule}`,
            messageId: contract.messageId,
            line: contract.line,
            severity: ERROR_SEVERITY,
          },
        ],
      );
    });

    test(`should accept the valid ${contract.rule} file without diagnostics`, async () => {
      const file = fileURLToPath(new URL(`${contract.rule}/valid.ts`, FIXTURE_ROOT));
      const results = await contractLinter(contract).lintFiles([file]);
      assert.equal(results.length, 1);
      assert.equal(results[0].fatalErrorCount, 0);
      assert.deepEqual(results[0].messages, []);
    });
  }
});
