#!/usr/bin/env node

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

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.join(__dirname, "..");
const rootPackagePath = path.join(repoRoot, "package.json");
const configPackagePath = path.join(repoRoot, "packages/config/package.json");
const pluginPackagePath = path.join(repoRoot, "packages/plugin/package.json");
const pluginPackageDir = path.join(repoRoot, "packages/plugin");
const configPackageDir = path.join(repoRoot, "packages/config");
const pluginPackageName = "eslint-plugin-zero-tolerance";
const releaseManifestPaths = [
  "package.json",
  "packages/plugin/package.json",
  "packages/config/package.json",
];

/** Prints CLI usage and examples for the release helper. */
function printHelp() {
  console.log(
    `
Usage:
  pnpm prepare-publish
  pnpm prepare-publish --release <patch|minor|major|x.y.z> [options]

Default:
  Replaces packages/config peerDependencies.eslint-plugin-zero-tolerance workspace:* with ^<pluginVersion>.

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
  pnpm prepare-publish
  pnpm prepare-publish --release patch --commit --tag --publish
  pnpm prepare-publish --release 1.2.0 --publish --restore-workspace
`.trim(),
  );
}

/** Prints a fatal error message and terminates the process. */
function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

/** Reads a JSON file, stripping a UTF-8 BOM and reporting path-specific parse errors. */
function readJson(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  try {
    return JSON.parse(text);
  } catch (error) {
    const relativePath = path.relative(repoRoot, filePath);
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

/** Writes a JSON file with stable formatting, or logs the write in dry-run mode. */
function writeJson(filePath, value, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] write ${path.relative(repoRoot, filePath)}`);
    return;
  }
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

/** Parses CLI flags into a normalized options object with basic validation. */
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
    "--skip-build": "skipBuild",
    "--skip-test": "skipTest",
    "--commit": "commit",
    "--tag": "tag",
    "--publish": "publish",
    "--restore-workspace": "restoreWorkspace",
    "--dry-run": "dryRun",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--release") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        fail("--release requires a value");
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
    fail("--tag requires --commit so the tag points at a release commit");
  }

  return options;
}

/** Runs a child process or logs the command when dry-run mode is enabled. */
function run(command, args, options = {}) {
  const { cwd = repoRoot, dryRun = false } = options;
  const display = `${command} ${args.join(" ")}`.trim();

  if (dryRun) {
    console.log(
      `[dry-run] (${path.relative(repoRoot, cwd) || "."}) ${display}`,
    );
    return;
  }

  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/** Returns true when the version is a simple x.y.z semantic version. */
function isSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/** Resolves the next release version from a bump keyword or explicit x.y.z value. */
function bumpVersion(version, releaseType) {
  if (!isSemver(version)) {
    fail(`Unsupported current version format: ${version}`);
  }

  if (isSemver(releaseType)) {
    return releaseType;
  }

  const [major, minor, patch] = version.split(".").map(Number);

  const bumpers = {
    major: () => `${major + 1}.0.0`,
    minor: () => `${major}.${minor + 1}.0`,
    patch: () => `${major}.${minor}.${patch + 1}`,
  };

  if (Object.hasOwn(bumpers, releaseType)) {
    return bumpers[releaseType]();
  }

  fail(
    `Unsupported release type "${releaseType}". Use patch, minor, major, or x.y.z`,
  );
}

/** Updates the config package's plugin peer dependency when the key exists. */
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

/** Sets the config package peer dependency to the current plugin release range. */
function setPluginPeerDependencyVersion(configPackage, pluginVersion) {
  return setPeerDependency(configPackage, `^${pluginVersion}`);
}

/** Restores the local-development workspace peer dependency marker. */
function restoreWorkspacePeerDependency(configPackage) {
  return setPeerDependency(configPackage, "workspace:*");
}

/** Refuses release mode when the git working tree contains uncommitted changes. */
function ensureCleanWorkingTree(dryRun) {
  if (dryRun) {
    console.log("[dry-run] validate clean git working tree");
    return;
  }

  const result = spawnSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    fail("Failed to check git working tree status");
  }

  if (result.stdout.trim() !== "") {
    fail(
      "Working tree is not clean. Commit or stash changes before running a release.",
    );
  }
}

/** Updates all versioned package manifests to the same release version. */
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
    `Set eslint-config peer dependency on eslint-plugin-zero-tolerance to ^${targetVersion}`,
  );
}

/** Backward-compatible mode: only convert workspace:* to a versioned peer dependency. */
function prepareOnly(dryRun) {
  const pluginPackage = readJson(pluginPackagePath);
  const configPackage = readJson(configPackagePath);
  const pluginVersion = pluginPackage.version;

  const updated = setPluginPeerDependencyVersion(configPackage, pluginVersion);

  if (!updated) {
    console.log("No eslint-plugin-zero-tolerance peer dependency found");
    return;
  }

  writeJson(configPackagePath, configPackage, dryRun);
  console.log(
    `Updated eslint-plugin-zero-tolerance peer dependency to ^${pluginVersion}`,
  );
}

/** Restores workspace:* in the config peer dependency if the dependency is present. */
function maybeRestoreWorkspace(dryRun) {
  const configPackage = readJson(configPackagePath);
  const restored = restoreWorkspacePeerDependency(configPackage);

  if (!restored) {
    console.log(
      "No eslint-plugin-zero-tolerance peer dependency found to restore",
    );
    return;
  }

  writeJson(configPackagePath, configPackage, dryRun);
  console.log("Restored workspace:* for development");
}

/** Runs repository build and test commands unless the corresponding skip flags are set. */
function runBuildAndTests(options) {
  if (!options.skipBuild) {
    run("pnpm", ["build"], { dryRun: options.dryRun });
  }
  if (!options.skipTest) {
    run("pnpm", ["test"], { dryRun: options.dryRun });
  }
}

/** Creates the release commit containing version and manifest changes. */
function commitRelease(tagName, dryRun) {
  run("git", ["add", ...releaseManifestPaths], { dryRun });
  run("git", ["commit", "-m", `chore(release): ${tagName}`], { dryRun });
}

/** Creates an annotated git tag for the release. */
function tagRelease(tagName, dryRun) {
  run("git", ["tag", "-a", tagName, "-m", tagName], { dryRun });
}

/** Publishes plugin and config packages to npm in the correct order. */
function publishRelease(dryRun) {
  run("npm", ["publish"], { cwd: pluginPackageDir, dryRun });
  run("npm", ["publish"], { cwd: configPackageDir, dryRun });
}

/** Restores workspace:* after release steps and prints a follow-up commit reminder. */
function maybeRestoreWorkspaceWithNotice(options) {
  if (!options.restoreWorkspace) {
    return;
  }

  maybeRestoreWorkspace(options.dryRun);
  console.log(
    "Note: workspace:* was restored after release steps. If you committed/tagged, commit the restoration separately.",
  );
}

/** Executes the original prepare-only flow with optional workspace restoration. */
function runPrepareMode(options) {
  prepareOnly(options.dryRun);
  if (options.restoreWorkspace) {
    maybeRestoreWorkspace(options.dryRun);
  }
}

/** Executes the full release flow driven by the parsed CLI options. */
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
