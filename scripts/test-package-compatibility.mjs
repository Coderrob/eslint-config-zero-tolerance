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

import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { x } from 'tinyexec';

const EXPECTED_RULE_ID = 'zero-tolerance/no-date-now';
const LEGACY_EXPECTED_RULE_ID = '@coderrob/zero-tolerance/no-date-now';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const CONSUMER_FIXTURES = {
  flat: 'eslint-flat',
  legacy: 'eslint-8-legacy',
};

/**
 * Returns a required parsed command-line option.
 *
 * @param value - Parsed option value, or undefined when omitted.
 * @param optionName - User-facing option name for error reporting.
 * @returns The required option value.
 * @throws {Error} When the required option was omitted.
 */
function requireOption(value, optionName) {
  if (value === undefined) throw new Error(`Missing required option ${optionName}`);
  return value;
}

/**
 * Reads the installed version selected by the workspace dependency graph.
 *
 * @param packageName - Package whose installed metadata supplies the version.
 * @returns The exact installed package version.
 */
function readInstalledVersion(packageName) {
  const packagePath = require.resolve(`${packageName}/package.json`);
  return JSON.parse(readFileSync(packagePath, 'utf8')).version;
}

/**
 * Runs a command and rejects unexpected exit statuses.
 *
 * @param command - Executable to run.
 * @param arguments_ - Arguments supplied to the executable.
 * @param options - Working directory and accepted-status configuration.
 * @returns Captured command output.
 * @throws {Error} When the command returns an unexpected exit status.
 */
async function run(command, arguments_, options) {
  const result = await x(command, arguments_, {
    nodeOptions: { cwd: options.cwd },
    throwOnError: false,
  });
  const allowedStatuses = options.allowedStatuses ?? [0];
  if (!allowedStatuses.includes(result.exitCode)) {
    throw new Error(
      `${command} ${arguments_.join(' ')} failed\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result;
}

/**
 * Locates exactly one packed artifact for a package prefix.
 *
 * @param packageDirectory - Directory containing packed artifacts.
 * @param filePrefix - Expected tarball filename prefix.
 * @returns Absolute path to the matching tarball.
 * @throws {Error} When exactly one matching tarball is not present.
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
 * Returns ESLint arguments for a consumer configuration style.
 *
 * @param configStyle - Consumer configuration style to execute.
 * @returns ESLint arguments required by the selected style.
 */
function getEslintConfigArguments(configStyle) {
  return configStyle === 'legacy' ? ['--no-eslintrc', '--config', '.eslintrc.cjs'] : [];
}

/**
 * Reads and validates the compatibility runner options.
 *
 * @returns Normalized compatibility runner options.
 * @throws {Error} When an option is absent or the config style is unsupported.
 */
function readOptions() {
  const { values } = parseArgs({
    options: {
      'config-style': { type: 'string' },
      'eslint-version': { type: 'string' },
      'package-dir': { type: 'string' },
    },
    strict: true,
  });
  const configStyle = requireOption(values['config-style'], '--config-style');
  if (!(configStyle in CONSUMER_FIXTURES))
    throw new Error(`Unsupported config style: ${configStyle}`);
  return {
    configStyle,
    eslintVersion: requireOption(values['eslint-version'], '--eslint-version'),
    packageDirectory: resolve(repoRoot, requireOption(values['package-dir'], '--package-dir')),
  };
}

/**
 * Installs packed packages and their compatibility peers into a consumer.
 *
 * @param consumerDirectory - Temporary consumer workspace.
 * @param pluginTarball - Packed plugin artifact path.
 * @param configTarball - Packed config artifact path.
 * @param eslintVersion - ESLint version selected by the CI matrix.
 * @returns A promise fulfilled after npm installs the dependencies.
 * @throws {Error} When npm installation fails.
 */
async function installConsumer(consumerDirectory, pluginTarball, configTarball, eslintVersion) {
  const dependencies = [
    pluginTarball,
    configTarball,
    `eslint@${eslintVersion}`,
    `@typescript-eslint/parser@${readInstalledVersion('@typescript-eslint/parser')}`,
    `typescript@${readInstalledVersion('typescript')}`,
  ];
  await run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      ...dependencies,
    ],
    {
      cwd: consumerDirectory,
    },
  );
}

/**
 * Verifies CommonJS, ESM, and declaration consumers.
 *
 * @param consumerDirectory - Temporary consumer workspace.
 * @returns A promise fulfilled after all module formats pass.
 * @throws {Error} When a consumer cannot resolve a packed package.
 */
async function verifyModuleFormats(consumerDirectory) {
  await run(process.execPath, ['verify-cjs.cjs'], { cwd: consumerDirectory });
  await run(process.execPath, ['verify-esm.mjs'], { cwd: consumerDirectory });
  const compiler = join(consumerDirectory, 'node_modules', 'typescript', 'bin', 'tsc');
  await run(
    process.execPath,
    [
      compiler,
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
    {
      cwd: consumerDirectory,
    },
  );
}

/**
 * Verifies that ESLint executes the expected packed preset rule.
 *
 * @param consumerDirectory - Temporary consumer workspace.
 * @param configStyle - Consumer configuration style to execute.
 * @returns A promise fulfilled when ESLint reports the expected rule.
 * @throws {Error} When ESLint fails or omits the expected rule report.
 */
async function verifyLintResult(consumerDirectory, configStyle) {
  const eslint = join(consumerDirectory, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const arguments_ = [...getEslintConfigArguments(configStyle), '--format', 'json', 'fixture.ts'];
  const result = await run(process.execPath, [eslint, ...arguments_], {
    allowedStatuses: [1],
    cwd: consumerDirectory,
  });
  const ruleIds = JSON.parse(result.stdout).flatMap((lintResult) =>
    lintResult.messages.map((message) => message.ruleId),
  );
  const expectedRuleId = configStyle === 'legacy' ? LEGACY_EXPECTED_RULE_ID : EXPECTED_RULE_ID;
  if (!ruleIds.includes(expectedRuleId)) {
    throw new Error(
      `Packed plugin did not report ${expectedRuleId}; received ${ruleIds.join(', ')}`,
    );
  }
}

/**
 * Exercises packed packages in an isolated consumer and removes it afterward.
 *
 * @returns A promise fulfilled when package compatibility passes.
 * @throws {Error} When installation or any consumer validation fails.
 */
async function main() {
  const options = readOptions();
  const pluginTarball = findPackedPackage(
    options.packageDirectory,
    'coderrob-eslint-plugin-zero-tolerance-',
  );
  const configTarball = findPackedPackage(
    options.packageDirectory,
    'coderrob-eslint-config-zero-tolerance-',
  );
  const consumerDirectory = mkdtempSync(join(tmpdir(), 'zero-tolerance-consumer-'));
  try {
    cpSync(resolve(repoRoot, 'test', 'consumers', 'common'), consumerDirectory, {
      recursive: true,
    });
    cpSync(
      resolve(repoRoot, 'test', 'consumers', CONSUMER_FIXTURES[options.configStyle]),
      consumerDirectory,
      { recursive: true },
    );
    await installConsumer(consumerDirectory, pluginTarball, configTarball, options.eslintVersion);
    await verifyModuleFormats(consumerDirectory);
    await verifyLintResult(consumerDirectory, options.configStyle);
    console.log(
      `Packed compatibility passed: Node ${process.version}, ESLint ${options.eslintVersion} (${basename(pluginTarball)}, ${basename(configTarball)})`,
    );
  } finally {
    rmSync(consumerDirectory, { force: true, recursive: true });
  }
}

await main();
