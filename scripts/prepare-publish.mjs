#!/usr/bin/env node

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

/**
 * Prepare packages for publishing, and optionally run a full release flow.
 *
 * Default behavior (backward-compatible):
 *   - Replaces config peer dependency workspace:* with the plugin version.
 *
 * Release behavior (explicit):
 *   - Bumps root/plugin/config versions
 *   - Replaces workspace:* peer dependency
 *   - Runs build/test
 *   - Optionally commits, tags, and publishes
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = join(currentFilePath, '..');
const repoRoot = join(currentDirPath, '..');
const rootPackagePath = join(repoRoot, 'package.json');
const configPackagePath = join(repoRoot, 'packages/config/package.json');
const pluginPackagePath = join(repoRoot, 'packages/plugin/package.json');
const pluginPackageDir = join(repoRoot, 'packages/plugin');
const configPackageDir = join(repoRoot, 'packages/config');
const pluginPackageName = '@coderrob/eslint-plugin-zero-tolerance';
const releaseManifestPaths = [
  'package.json',
  'packages/plugin/package.json',
  'packages/config/package.json',
];

/** Prints CLI usage and examples for the release helper. */
function printHelp() {
  console.log(
    `
Usage:
  pnpm release:prepare
  pnpm release:prepare --release <patch|minor|major|x.y.z> [options]

Default:
  Replaces packages/config peerDependencies.@coderrob/eslint-plugin-zero-tolerance workspace:* with ^<pluginVersion>.

Release options:
  --release <value>      Required for full release flow (patch|minor|major|x.y.z)
  --skip-build           Skip "pnpm build"
  --skip-test            Skip "pnpm test"
  --commit               Create release commit after manifest updates/build/test
  --tag                  Create annotated git tag (requires --commit)
  --publish              Publish plugin and config packages with npm publish
  --restore-workspace    Restore workspace:* after publishing/preparing
  --dry-run              Print actions without modifying files or running commands
  --help                 Show this help

Examples:
  pnpm release:prepare
  pnpm release:prepare --release patch --commit --tag --publish
  pnpm release:prepare --release 1.2.0 --publish --restore-workspace
`.trim(),
  );
}

/**
 * Prints a fatal error message and terminates the process.
 * @param {string} message - The error message to display before exiting.
 * @throws {Error} Always throws by calling process.exit(1).
 */
function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

/**
 * Reads a JSON file, stripping a UTF-8 BOM and reporting path-specific parse errors.
 * @param {string} filePath - The path to the JSON file to read.
 * @returns {*} The parsed JSON object.
 * @throws {Error} If the JSON is invalid or the file cannot be read.
 */
function readJson(filePath) {
  const text = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  try {
    return JSON.parse(text);
  } catch (error) {
    const relativePath = relative(repoRoot, filePath);
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

/**
 * Writes a JSON file with stable formatting, or logs the write in dry-run mode.
 * @param {string} filePath - The path to the JSON file to write.
 * @param {*} value - The object to serialize to JSON.
 * @param {boolean} dryRun - If true, only logs the action without writing the file.
 */
function writeJson(filePath, value, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] write ${relative(repoRoot, filePath)}`);
    return;
  }
  writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

/**
 * Parses CLI flags into a normalized options object with basic validation.
 * @param {string[]} argv - The command line arguments array to parse.
 * @returns {object} The parsed options object containing release settings and flags.
 * @throws {Error} If invalid arguments are provided or required values are missing.
 */
function parseArgs(argv) {
  const options = {
    release: null,
    skipBuild: false,
    skipTest: false,
    commit: false,
    tag: false,
    publish: false,
    restoreWorkspace: false,
    dryRun: false,
    help: false,
  };
  const flagMap = {
    '--skip-build': 'skipBuild',
    '--skip-test': 'skipTest',
    '--commit': 'commit',
    '--tag': 'tag',
    '--publish': 'publish',
    '--restore-workspace': 'restoreWorkspace',
    '--dry-run': 'dryRun',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--release') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        fail('--release requires a value');
      }
      options.release = next;
      i += 1;
      continue;
    }

    if (Object.hasOwn(flagMap, arg)) {
      options[flagMap[arg]] = true;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  if (options.tag && !options.commit) {
    fail('--tag requires --commit so the tag points at a release commit');
  }

  return options;
}

/**
 * Runs a child process or logs the command when dry-run mode is enabled.
 * @param {string} command - The command to execute.
 * @param {string[]} args - The arguments to pass to the command.
 * @param {object} [options] - Optional settings for execution.
 * @param {string} [options.cwd] - The working directory for the command (defaults to repo root).
 * @param {boolean} [options.dryRun] - If true, only logs the command without executing.
 * @throws {Error} If the command exits with a non-zero status.
 */
function run(command, args, options = {}) {
  const { cwd = repoRoot, dryRun = false } = options;
  const display = `${command} ${args.join(' ')}`.trim();

  if (dryRun) {
    console.log(`[dry-run] (${relative(repoRoot, cwd) || '.'}) ${display}`);
    return;
  }

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/**
 * Returns true when the version is a simple x.y.z semantic version.
 * @param {string} version - The version string to check.
 * @returns {boolean} True if the version matches semantic versioning format (x.y.z).
 */
function isSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Resolves the next release version from a bump keyword or explicit x.y.z value.
 * @param {string} version - The current version string in semver format.
 * @param {string} releaseType - The bump type (patch, minor, major) or explicit version string.
 * @returns {string} The next version string.
 * @throws {Error} If the current version format is unsupported or release type is invalid.
 */
function bumpVersion(version, releaseType) {
  if (!isSemver(version)) {
    fail(`Unsupported current version format: ${version}`);
  }

  if (isSemver(releaseType)) {
    return releaseType;
  }

  const [major, minor, patch] = version.split('.').map(Number);

  const bumpers = {
    major: () => `${major + 1}.0.0`,
    minor: () => `${major}.${minor + 1}.0`,
    patch: () => `${major}.${minor}.${patch + 1}`,
  };

  if (Object.hasOwn(bumpers, releaseType)) {
    return bumpers[releaseType]();
  }

  fail(`Unsupported release type "${releaseType}". Use patch, minor, major, or x.y.z`);
}

/**
 * Updates the config package's plugin peer dependency when the key exists.
 * @param {object} configPackage - The config package.json object to modify.
 * @param {string} value - The new value for the peer dependency.
 * @returns {boolean} True if the dependency was updated, false if it didn't exist.
 */
function setPeerDependency(configPackage, value) {
  if (
    !configPackage.peerDependencies ||
    !Object.hasOwn(configPackage.peerDependencies, pluginPackageName)
  ) {
    return false;
  }

  configPackage.peerDependencies[pluginPackageName] = value;
  return true;
}

/**
 * Sets the config package peer dependency to the current plugin release range.
 * @param {object} configPackage - The config package.json object to modify.
 * @param {string} pluginVersion - The plugin version to set as peer dependency.
 * @returns {boolean} True if the dependency was set, false if it didn't exist.
 */
function setPluginPeerDependencyVersion(configPackage, pluginVersion) {
  return setPeerDependency(configPackage, `^${pluginVersion}`);
}

/**
 * Restores the local-development workspace peer dependency marker.
 * @param {object} configPackage - The config package.json object to modify.
 * @returns {boolean} True if the dependency was restored, false if it didn't exist.
 */
function restoreWorkspacePeerDependency(configPackage) {
  return setPeerDependency(configPackage, 'workspace:*');
}

/**
 * Refuses release mode when the git working tree contains uncommitted changes.
 * @param {boolean} dryRun - If true, only logs the validation without checking git status.
 * @throws {Error} If the working tree is not clean (has uncommitted changes).
 */
function ensureCleanWorkingTree(dryRun) {
  if (dryRun) {
    console.log('[dry-run] validate clean git working tree');
    return;
  }

  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('Failed to check git working tree status');
  }

  if (result.stdout.trim() !== '') {
    fail('Working tree is not clean. Commit or stash changes before running a release.');
  }
}

/**
 * Updates all versioned package manifests to the same release version.
 * @param {string} targetVersion - The version to set in all package manifests.
 * @param {boolean} dryRun - If true, only logs the changes without writing files.
 */
function updateVersions(targetVersion, dryRun) {
  const rootPackage = readJson(rootPackagePath);
  const pluginPackage = readJson(pluginPackagePath);
  const configPackage = readJson(configPackagePath);

  rootPackage.version = targetVersion;
  pluginPackage.version = targetVersion;
  configPackage.version = targetVersion;
  setPluginPeerDependencyVersion(configPackage, targetVersion);

  writeJson(rootPackagePath, rootPackage, dryRun);
  writeJson(pluginPackagePath, pluginPackage, dryRun);
  writeJson(configPackagePath, configPackage, dryRun);

  console.log(`Updated versions to ${targetVersion}`);
  console.log(
    `Set eslint-config peer dependency on @coderrob/eslint-plugin-zero-tolerance to ^${targetVersion}`,
  );
}

/**
 * Backward-compatible mode: only convert workspace:* to a versioned peer dependency.
 * @param {boolean} dryRun - If true, only logs the changes without writing files.
 */
function prepareOnly(dryRun) {
  const pluginPackage = readJson(pluginPackagePath);
  const configPackage = readJson(configPackagePath);
  const pluginVersion = pluginPackage.version;

  const updated = setPluginPeerDependencyVersion(configPackage, pluginVersion);

  if (!updated) {
    console.log('No @coderrob/eslint-plugin-zero-tolerance peer dependency found');
    return;
  }

  writeJson(configPackagePath, configPackage, dryRun);
  console.log(
    `Updated @coderrob/eslint-plugin-zero-tolerance peer dependency to ^${pluginVersion}`,
  );
}

/**
 * Restores workspace:* in the config peer dependency if the dependency is present.
 * @param {boolean} dryRun - If true, only logs the changes without writing files.
 */
function maybeRestoreWorkspace(dryRun) {
  const configPackage = readJson(configPackagePath);
  const restored = restoreWorkspacePeerDependency(configPackage);

  if (!restored) {
    console.log('No @coderrob/eslint-plugin-zero-tolerance peer dependency found to restore');
    return;
  }

  writeJson(configPackagePath, configPackage, dryRun);
  console.log('Restored workspace:* for development');
}

/**
 * Runs repository build and test commands unless the corresponding skip flags are set.
 * @param {object} options - The options object containing skip flags and dry run setting.
 * @param {boolean} options.skipBuild - If true, skips the build step.
 * @param {boolean} options.skipTest - If true, skips the test step.
 * @param {boolean} options.dryRun - If true, only logs the commands without executing.
 */
function runBuildAndTests(options) {
  if (!options.skipBuild) {
    run('pnpm', ['build'], { dryRun: options.dryRun });
  }
  if (!options.skipTest) {
    run('pnpm', ['test'], { dryRun: options.dryRun });
  }
}

/**
 * Creates the release commit containing version and manifest changes.
 * @param {string} tagName - The tag name for the release (e.g., "v1.2.3").
 * @param {boolean} dryRun - If true, only logs the git commands without executing.
 */
function commitRelease(tagName, dryRun) {
  run('git', ['add', ...releaseManifestPaths], { dryRun });
  run('git', ['commit', '-m', `chore(release): ${tagName}`], { dryRun });
}

/**
 * Creates an annotated git tag for the release.
 * @param {string} tagName - The tag name for the release.
 * @param {boolean} dryRun - If true, only logs the git command without executing.
 */
function tagRelease(tagName, dryRun) {
  run('git', ['tag', '-a', tagName, '-m', tagName], { dryRun });
}

/**
 * Publishes plugin and config packages to npm in the correct order.
 * @param {boolean} dryRun - If true, only logs the npm publish commands without executing.
 */
function publishRelease(dryRun) {
  run('npm', ['publish'], { cwd: pluginPackageDir, dryRun });
  run('npm', ['publish'], { cwd: configPackageDir, dryRun });
}

/**
 * Restores workspace:* after release steps and prints a follow-up commit reminder.
 * @param {object} options - The options object.
 * @param {boolean} options.restoreWorkspace - If true, restores the workspace dependency.
 * @param {boolean} options.dryRun - If true, only logs the restoration without writing files.
 */
function maybeRestoreWorkspaceWithNotice(options) {
  if (!options.restoreWorkspace) {
    return;
  }

  maybeRestoreWorkspace(options.dryRun);
  console.log(
    'Note: workspace:* was restored after release steps. If you committed/tagged, commit the restoration separately.',
  );
}

/**
 * Executes the original prepare-only flow with optional workspace restoration.
 * @param {object} options - The options object.
 * @param {boolean} options.restoreWorkspace - If true, restores workspace after preparation.
 * @param {boolean} options.dryRun - If true, only logs actions without modifying files.
 */
function runPrepareMode(options) {
  prepareOnly(options.dryRun);
  if (options.restoreWorkspace) {
    maybeRestoreWorkspace(options.dryRun);
  }
}

/**
 * Executes the full release flow driven by the parsed CLI options.
 * @param {object} options - The options object containing all release settings.
 * @param {string} options.release - The release type or version.
 * @param {boolean} options.commit - If true, creates a release commit.
 * @param {boolean} options.tag - If true, creates a git tag.
 * @param {boolean} options.publish - If true, publishes to npm.
 * @param {boolean} options.restoreWorkspace - If true, restores workspace after release.
 * @param {boolean} options.dryRun - If true, only logs actions without executing.
 */
function runReleaseMode(options) {
  ensureCleanWorkingTree(options.dryRun);
  const pluginPackage = readJson(pluginPackagePath);
  const nextVersion = bumpVersion(pluginPackage.version, options.release);
  const tagName = `v${nextVersion}`;

  updateVersions(nextVersion, options.dryRun);
  runBuildAndTests(options);

  if (options.commit) {
    commitRelease(tagName, options.dryRun);
  }
  if (options.tag) {
    tagRelease(tagName, options.dryRun);
  }
  if (options.publish) {
    publishRelease(options.dryRun);
  }
  maybeRestoreWorkspaceWithNotice(options);

  console.log(`Release preparation complete for ${tagName}`);
}

/** Entry point that dispatches to prepare-only or full release mode. */
function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (options.release === null) {
    runPrepareMode(options);
    return;
  }

  runReleaseMode(options);
}

main();
