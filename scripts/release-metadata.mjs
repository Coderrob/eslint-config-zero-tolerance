/**
 * Prepares and verifies the published plugin's release metadata.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePluginManifest } from './release-helpers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = resolve(ROOT, 'packages/plugin/package.json');
const CHANGELOG_PATH = resolve(ROOT, 'CHANGELOG.md');
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;

/**
 * Parses a safe stable semantic version into numeric components.
 *
 * @param version - Version to parse.
 * @returns Major, minor, and revision numbers.
 * @throws When the version is invalid.
 */
function parseVersion(version) {
  const match = VERSION_PATTERN.exec(version);
  if (!match) throw new Error(`Invalid plugin version: ${version}`);
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part))) {
    throw new Error(`Invalid plugin version: ${version}`);
  }
  return parts;
}

/**
 * Returns the next plugin version for a selected release size.
 *
 * @param currentVersion - Current stable semantic version.
 * @param releaseSize - Major, minor, or revision (patch) selection.
 * @returns The next stable semantic version.
 * @throws When the version or release size is invalid.
 */
export function nextVersion(currentVersion, releaseSize) {
  const index = new Map([
    ['major', 0],
    ['minor', 1],
    ['revision', 2],
  ]).get(releaseSize);
  if (index === undefined) {
    throw new Error(`Invalid release size: ${releaseSize}`);
  }
  const parts = parseVersion(currentVersion);
  parts[index] += 1;
  if (!Number.isSafeInteger(parts[index]))
    throw new Error(`Invalid plugin version: ${currentVersion}`);
  for (let position = index + 1; position < parts.length; position += 1) parts[position] = 0;
  return parts.join('.');
}

/**
 * Validates a UTC release date.
 *
 * @param releaseDate - Date in YYYY-MM-DD format.
 * @throws When the date is invalid.
 */
function validateReleaseDate(releaseDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(releaseDate))
    throw new Error(`Invalid release date: ${releaseDate}`);
  const date = new Date(`${releaseDate}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== releaseDate) {
    throw new Error(`Invalid release date: ${releaseDate}`);
  }
}

/**
 * Finds the Unreleased and previous release sections.
 *
 * @param changelog - Existing changelog contents.
 * @param currentVersion - Current plugin version.
 * @param newVersion - Version being prepared.
 * @returns Changelog headings with source offsets.
 * @throws When the changelog has stale or duplicate release sections.
 */
function getReleaseHeadings(changelog, currentVersion, newVersion) {
  const headings = [...changelog.matchAll(/^## \[([^\]]+)\](?: - [^\r\n]+)?\r?\n/gmu)];
  validateUnreleasedHeadings(headings);
  if (headings[1][1] !== currentVersion) {
    throw new Error(`Latest changelog release must be ${currentVersion}`);
  }
  if (headings.some((heading) => heading[1] === newVersion)) {
    throw new Error(`Changelog already contains ${newVersion}`);
  }
  return headings;
}

/**
 * Requires one leading Unreleased section and a following release.
 *
 * @param headings - Changelog headings with their source offsets.
 * @throws When the changelog lacks the expected section structure.
 */
function validateUnreleasedHeadings(headings) {
  if (
    headings.length < 2 ||
    headings[0][1] !== 'Unreleased' ||
    headings.filter((heading) => heading[1] === 'Unreleased').length !== 1
  ) {
    throw new Error('Changelog must start with one Unreleased section followed by a release');
  }
}

/**
 * Moves the current Unreleased changes into a dated version section.
 *
 * @param changelog - Existing changelog contents.
 * @param currentVersion - Version of the last released plugin.
 * @param newVersion - Version being prepared.
 * @param releaseDate - Release preparation date in YYYY-MM-DD format.
 * @returns Changelog with a fresh Unreleased section.
 * @throws When the changelog or release date is inconsistent.
 */
export function rollChangelog(changelog, currentVersion, newVersion, releaseDate) {
  validateReleaseDate(releaseDate);
  const newline = changelog.includes('\r\n') ? '\r\n' : '\n';
  const headings = getReleaseHeadings(changelog, currentVersion, newVersion);
  validateVersionIncrease(currentVersion, newVersion);
  const changes = changelog.slice(headings[0].index + headings[0][0].length, headings[1].index);
  if (!/^[-*] \S/mu.test(changes)) {
    throw new Error('Unreleased section must contain at least one change');
  }

  const prefix = changelog.slice(0, headings[0].index);
  const suffix = changelog.slice(headings[1].index);
  return `${prefix}## [Unreleased]${newline}${newline}## [${newVersion}] - ${releaseDate}${newline}${changes}${suffix}`;
}

/**
 * Requires release versions to advance without accepting malformed or overflowing components.
 *
 * @param currentVersion - Previously released stable version.
 * @param newVersion - Requested stable version.
 * @throws When the requested release does not advance the current version.
 */
function validateVersionIncrease(currentVersion, newVersion) {
  const previous = parseVersion(currentVersion);
  const next = parseVersion(newVersion);
  const difference = next.map((part, index) => part - previous[index]).find((part) => part !== 0);
  if (difference === undefined || difference < 0) throw new Error('Release version must increase');
}

/**
 * Checks that a release tag matches the plugin manifest and changelog.
 *
 * @param manifest - Parsed plugin package manifest.
 * @param changelog - Changelog contents at the tag.
 * @param tag - GitHub release tag name.
 * @throws When release metadata does not agree.
 */
export function verifyReleaseMetadata(manifest, changelog, tag) {
  validatePluginManifest(manifest);
  parseVersion(manifest.version);
  if (tag !== `v${manifest.version}`) {
    throw new Error(`Release tag ${tag} must match plugin version v${manifest.version}`);
  }
  const releases = getVerifiedReleaseHeadings(changelog, manifest.version);
  validateReleaseDate(releases[1][2]);
  const notes = changelog.slice(releases[1].index + releases[1][0].length, releases[2]?.index);
  if (!/^[-*] \S/mu.test(notes))
    throw new Error('Release section must contain at least one change');
}

/**
 * Requires one current dated release immediately after the Unreleased section.
 *
 * @param changelog - Changelog contents to verify.
 * @param version - Expected current release version.
 * @returns Parsed release headings in source order.
 * @throws When release headings are missing, duplicated, stale, or undated.
 */
function getVerifiedReleaseHeadings(changelog, version) {
  const releases = [...changelog.matchAll(/^## \[([^\]]+)\](?: - ([^\r\n]+))?\r?$/gmu)];
  validateUnreleasedHeadings(releases);
  const matches = releases.filter((release) => release[1] === version);
  if (matches.length !== 1 || releases[1][1] !== version || !matches[0][2]) {
    throw new Error(`Changelog must contain a dated ${version} release`);
  }
  return releases;
}

/**
 * Reads release metadata and runs the selected command.
 *
 * @param args - Command and its arguments from the CLI.
 * @throws When the command or release metadata is invalid.
 */
function run(args) {
  const manifestText = readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestText);
  validatePluginManifest(manifest);
  const changelog = readFileSync(CHANGELOG_PATH, 'utf8');
  if (args[0] === 'verify') verifyReleaseCommand(args, manifest, changelog);
  else if (args[0] === 'prepare') prepareReleaseCommand(args, manifestText, manifest, changelog);
  else throw new Error('Expected prepare or verify command');
}

/**
 * Verifies the tag passed to the command line.
 *
 * @param args - CLI arguments.
 * @param manifest - Plugin package manifest.
 * @param changelog - Current changelog text.
 * @throws When arguments or release metadata are invalid.
 */
function verifyReleaseCommand(args, manifest, changelog) {
  if (args.length !== 2) throw new Error('Usage: release-metadata.mjs verify <vX.Y.Z>');
  verifyReleaseMetadata(manifest, changelog, args[1]);
}

/**
 * Writes the prepared plugin version and changelog to disk.
 *
 * @param args - CLI arguments.
 * @param manifestText - Existing package manifest text.
 * @param manifest - Parsed package manifest.
 * @param changelog - Existing changelog text.
 * @throws When arguments or release metadata are invalid.
 */
function prepareReleaseCommand(args, manifestText, manifest, changelog) {
  if (args.length !== 3) {
    throw new Error('Usage: release-metadata.mjs prepare <major|minor|revision> <YYYY-MM-DD>');
  }
  const version = nextVersion(manifest.version, args[1]);
  const updatedChangelog = rollChangelog(changelog, manifest.version, version, args[2]);
  manifest.version = version;
  const newline = manifestText.includes('\r\n') ? '\r\n' : '\n';
  writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(manifest, null, 2).replaceAll('\n', newline)}${newline}`,
  );
  writeFileSync(CHANGELOG_PATH, updatedChangelog);
  process.stdout.write(`${version}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2));
}
