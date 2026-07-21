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
import { cpSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const PARSER_VERSION = '8.59.3';
const TYPESCRIPT_VERSION = '5.9.3';
const EXPECTED_RULE_ID = 'zero-tolerance/no-date-now';
const LEGACY_EXPECTED_RULE_ID = '@coderrob/zero-tolerance/no-date-now';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONSUMER_FIXTURES = {
  flat: 'eslint-flat',
  legacy: 'eslint-8-legacy',
};

/**
 * Returns a required parsed command-line option.
 *
 * @param value - Parsed option value, or undefined when the option was omitted.
 * @param optionName - User-facing option name for error reporting.
 * @returns The required option value.
 * @throws {Error} When the required option was omitted.
 */
function requireOption(value, optionName) {
  if (value === undefined) {
    throw new Error(`Missing required option ${optionName}`);
  }
  return value;
}

/**
 * Returns captured process output without rendering absent values.
 *
 * @param output - Captured standard output or standard error value.
 * @returns Captured output, or an empty string when no output was captured.
 */
function formatProcessOutput(output) {
  if (output === undefined) return '';
  if (output === null) return '';
  return output;
}

/**
 * Throws when a child process failed to start or exited unexpectedly.
 *
 * @param result - Synchronous child-process result to validate.
 * @param command - Executed command name or path.
 * @param arguments_ - Arguments supplied to the command.
 * @param allowedStatuses - Additional accepted nonzero exit statuses.
 * @throws {Error} When the process could not start or returned an unexpected status.
 */
function assertCommandSucceeded(result, command, arguments_, allowedStatuses) {
  if (result.error !== undefined) throw result.error;
  if (result.status === 0) return;
  if (allowedStatuses.includes(result.status)) return;
  throw new Error(
    `${command} ${arguments_.join(' ')} exited with ${String(result.status)}\n${formatProcessOutput(result.stdout)}\n${formatProcessOutput(result.stderr)}`,
  );
}

/**
 * Runs a child process and throws when it does not exit successfully.
 *
 * @param command - Command name or executable path.
 * @param arguments_ - Arguments supplied to the command.
 * @param options - Working directory, capture mode, and accepted-status configuration.
 * @returns The completed synchronous child-process result.
 */
function run(command, arguments_, options) {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  assertCommandSucceeded(result, command, arguments_, options.allowedStatuses ?? []);
  return result;
}

/**
 * Returns a platform-safe npm command and its leading arguments.
 *
 * @returns Command executable and arguments required to invoke npm.
 */
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

/**
 * Locates exactly one packed artifact for a package prefix.
 *
 * @param packageDirectory - Directory containing packed package artifacts.
 * @param filePrefix - Expected tarball filename prefix.
 * @returns Absolute path to the single matching tarball.
 * @throws {Error} When the directory does not contain exactly one matching tarball.
 */
function findPackedPackage(packageDirectory, filePrefix) {
  const matches = readdirSync(packageDirectory)
    .filter((fileName) => fileName.startsWith(filePrefix) && fileName.endsWith('.tgz'))
    .map((fileName) => resolve(packageDirectory, fileName));
  if (matches.length !== 1) {
    throw new Error(`Expected one ${filePrefix} tarball, found ${String(matches.length)}`);
  }
  return matches[0];
}

/**
 * Returns ESLint arguments for a checked-in consumer fixture.
 *
 * @param configStyle - Consumer configuration style to execute.
 * @returns ESLint arguments required by the selected configuration style.
 * @throws {Error} When the configuration style is unsupported.
 */
function getEslintConfigArguments(configStyle) {
  if (configStyle === 'legacy') {
    return ['--no-eslintrc', '--config', '.eslintrc.cjs'];
  }
  if (configStyle === 'flat') {
    return [];
  }
  throw new Error(`Unsupported config style: ${configStyle}`);
}

const { values: options } = parseArgs({
  options: {
    'config-style': { type: 'string' },
    'eslint-version': { type: 'string' },
    'package-dir': { type: 'string' },
  },
  strict: true,
});
const packageDirectory = resolve(repoRoot, requireOption(options['package-dir'], '--package-dir'));
const eslintVersion = requireOption(options['eslint-version'], '--eslint-version');
const configStyle = requireOption(options['config-style'], '--config-style');
const expectedLintRuleId = configStyle === 'legacy' ? LEGACY_EXPECTED_RULE_ID : EXPECTED_RULE_ID;
const pluginTarball = findPackedPackage(packageDirectory, 'coderrob-eslint-plugin-zero-tolerance-');
const configTarball = findPackedPackage(packageDirectory, 'coderrob-eslint-config-zero-tolerance-');
const consumerDirectory = mkdtempSync(join(tmpdir(), 'zero-tolerance-consumer-'));
const npmInvocation = getNpmInvocation();
const fixtureName = CONSUMER_FIXTURES[configStyle];

if (fixtureName === undefined) {
  throw new Error(`Unsupported config style: ${configStyle}`);
}

cpSync(resolve(repoRoot, 'test', 'consumers', 'common'), consumerDirectory, { recursive: true });
cpSync(resolve(repoRoot, 'test', 'consumers', fixtureName), consumerDirectory, { recursive: true });
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

run(process.execPath, ['verify-cjs.cjs'], { cwd: consumerDirectory });
run(process.execPath, ['verify-esm.mjs'], { cwd: consumerDirectory });
run(
  process.execPath,
  [
    join(consumerDirectory, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--module',
    'Node16',
    '--moduleResolution',
    'Node16',
    '--noEmit',
    '--strict',
    '--target',
    'ES2022',
    'verify-types.cts',
    'verify-types.mts',
  ],
  { cwd: consumerDirectory },
);

const configArguments = getEslintConfigArguments(configStyle);
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
