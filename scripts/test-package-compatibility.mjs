/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_PACKAGE = '@coderrob/eslint-plugin-zero-tolerance';
const CONFIG_PACKAGE = '@coderrob/eslint-config-zero-tolerance';
const PARSER_VERSION = '8.59.3';
const TYPESCRIPT_VERSION = '5.9.3';
const EXPECTED_RULE_ID = 'zero-tolerance/no-date-now';
const LEGACY_EXPECTED_RULE_ID = '@coderrob/zero-tolerance/no-date-now';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Returns the value following a required command-line option. */
function readOption(optionName) {
  const optionIndex = process.argv.indexOf(optionName);
  const value = process.argv[optionIndex + 1];
  if (optionIndex === -1 || value === undefined || value.startsWith('--')) {
    throw new Error(`Missing required option ${optionName}`);
  }
  return value;
}

/** Runs a child process and throws when it does not exit successfully. */
function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.error !== undefined) {
    throw result.error;
  }
  if (!options.allowedStatuses?.includes(result.status) && result.status !== 0) {
    throw new Error(
      `${command} ${arguments_.join(' ')} exited with ${String(result.status)}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    );
  }
  return result;
}

/** Returns a platform-safe npm command and its leading arguments. */
function getNpmInvocation() {
  const npmCliPath = resolve(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (existsSync(npmCliPath)) {
    return { arguments: [npmCliPath], command: process.execPath };
  }
  return {
    arguments: [],
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
  };
}

/** Locates exactly one packed artifact for a package prefix. */
function findPackedPackage(packageDirectory, filePrefix) {
  const matches = readdirSync(packageDirectory)
    .filter((fileName) => fileName.startsWith(filePrefix) && fileName.endsWith('.tgz'))
    .map((fileName) => resolve(packageDirectory, fileName));
  if (matches.length !== 1) {
    throw new Error(`Expected one ${filePrefix} tarball, found ${String(matches.length)}`);
  }
  return matches[0];
}

/** Writes the CommonJS and ESM package export smoke tests. */
function writeModuleSmokeTests(consumerDirectory) {
  writeFileSync(
    join(consumerDirectory, 'verify-cjs.cjs'),
    `const assert = require('node:assert/strict');
const plugin = require('${PLUGIN_PACKAGE}');
const configs = require('${CONFIG_PACKAGE}');
const recommended = require('${CONFIG_PACKAGE}/recommended');
const strict = require('${CONFIG_PACKAGE}/strict');
assert.equal(plugin.meta.name, '${PLUGIN_PACKAGE}');
assert.ok(plugin.rules['no-date-now']);
assert.ok(configs.recommended.rules['${EXPECTED_RULE_ID}']);
assert.ok(configs.strict.rules['${EXPECTED_RULE_ID}']);
assert.ok(configs.legacyRecommended.rules);
assert.ok(configs.legacyStrict.rules);
assert.ok((recommended.default ?? recommended).rules['${EXPECTED_RULE_ID}']);
assert.ok((strict.default ?? strict).rules['${EXPECTED_RULE_ID}']);
`,
  );
  writeFileSync(
    join(consumerDirectory, 'verify-esm.mjs'),
    `import assert from 'node:assert/strict';
import plugin from '${PLUGIN_PACKAGE}';
import configs, {
  legacyRecommended,
  legacyStrict,
  recommended as namedRecommended,
  strict as namedStrict,
} from '${CONFIG_PACKAGE}';
import recommended from '${CONFIG_PACKAGE}/recommended';
import strict from '${CONFIG_PACKAGE}/strict';
assert.equal(plugin.meta.name, '${PLUGIN_PACKAGE}');
assert.ok(plugin.rules['no-date-now']);
assert.equal(configs.recommended, namedRecommended);
assert.equal(configs.strict, namedStrict);
assert.equal(configs.legacyRecommended, legacyRecommended);
assert.equal(configs.legacyStrict, legacyStrict);
assert.ok(recommended.rules['${EXPECTED_RULE_ID}']);
assert.ok(strict.rules['${EXPECTED_RULE_ID}']);
`,
  );
}

/** Writes the requested legacy or flat ESLint consumer configuration. */
function writeEslintConfig(consumerDirectory, configStyle) {
  if (configStyle === 'legacy') {
    writeFileSync(
      join(consumerDirectory, '.eslintrc.cjs'),
      `module.exports = {
  extends: ['plugin:@coderrob/zero-tolerance/legacy-recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@coderrob/zero-tolerance'],
  rules: { '${LEGACY_EXPECTED_RULE_ID}': 'error' },
};
`,
    );
    return ['--no-eslintrc', '--config', '.eslintrc.cjs'];
  }
  if (configStyle === 'flat') {
    writeFileSync(
      join(consumerDirectory, 'eslint.config.mjs'),
      `import parser from '@typescript-eslint/parser';
import plugin from '${PLUGIN_PACKAGE}';
export default [{
  files: ['**/*.ts'],
  languageOptions: { parser },
  plugins: { 'zero-tolerance': plugin },
  rules: { '${EXPECTED_RULE_ID}': 'error' },
}];
`,
    );
    return [];
  }
  throw new Error(`Unsupported config style: ${configStyle}`);
}

const packageDirectory = resolve(repoRoot, readOption('--package-dir'));
const eslintVersion = readOption('--eslint-version');
const configStyle = readOption('--config-style');
const expectedLintRuleId = configStyle === 'legacy' ? LEGACY_EXPECTED_RULE_ID : EXPECTED_RULE_ID;
const pluginTarball = findPackedPackage(packageDirectory, 'coderrob-eslint-plugin-zero-tolerance-');
const configTarball = findPackedPackage(packageDirectory, 'coderrob-eslint-config-zero-tolerance-');
const consumerDirectory = mkdtempSync(join(tmpdir(), 'zero-tolerance-consumer-'));
const npmInvocation = getNpmInvocation();

writeFileSync(
  join(consumerDirectory, 'package.json'),
  `${JSON.stringify({ name: 'zero-tolerance-compatibility-consumer', private: true }, null, 2)}\n`,
);
run(
  npmInvocation.command,
  [
    ...npmInvocation.arguments,
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--no-package-lock',
    pluginTarball,
    configTarball,
    `eslint@${eslintVersion}`,
    `@typescript-eslint/parser@${PARSER_VERSION}`,
    `typescript@${TYPESCRIPT_VERSION}`,
  ],
  { cwd: consumerDirectory },
);

writeModuleSmokeTests(consumerDirectory);
run(process.execPath, ['verify-cjs.cjs'], { cwd: consumerDirectory });
run(process.execPath, ['verify-esm.mjs'], { cwd: consumerDirectory });

writeFileSync(join(consumerDirectory, 'fixture.ts'), 'const timestamp = Date.now();\n');
const configArguments = writeEslintConfig(consumerDirectory, configStyle);
const eslintResult = run(
  process.execPath,
  [
    join(consumerDirectory, 'node_modules', 'eslint', 'bin', 'eslint.js'),
    ...configArguments,
    '--format',
    'json',
    'fixture.ts',
  ],
  { allowedStatuses: [1], capture: true, cwd: consumerDirectory },
);
const lintResults = JSON.parse(eslintResult.stdout);
const reportedRuleIds = lintResults.flatMap((result) =>
  result.messages.map((message) => message.ruleId),
);
if (!reportedRuleIds.includes(expectedLintRuleId)) {
  throw new Error(
    `Packed plugin did not report ${expectedLintRuleId}; received ${reportedRuleIds.join(', ') || 'no rule IDs'}`,
  );
}

console.log(
  `Packed package compatibility passed for Node ${process.version}, ESLint ${eslintVersion}, and ${configStyle} config (${basename(pluginTarball)}, ${basename(configTarball)})`,
);
