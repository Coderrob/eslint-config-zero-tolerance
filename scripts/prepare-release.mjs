import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  createReleaseChangelog,
  incrementVersion,
  validatePluginManifest,
} from './release-helpers.mjs';

/**
 * Updates only the plugin manifest and root changelog for a release candidate.
 *
 * @param root - Repository root directory.
 * @param bump - Major, minor, or revision increment.
 * @param date - Release date in YYYY-MM-DD format.
 * @returns Prepared plugin version.
 * @throws {Error} When files are unavailable or release validation fails.
 */
export function prepareRelease(root, bump, date) {
  const manifestPath = resolve(root, 'packages/plugin/package.json');
  const changelogPath = resolve(root, 'CHANGELOG.md');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const version = incrementVersion(validatePluginManifest(manifest), bump);
  const changelog = createReleaseChangelog(readFileSync(changelogPath, 'utf8'), version, date);
  writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, version }, null, 2)}\n`);
  writeFileSync(changelogPath, changelog);
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  console.log(prepareRelease(root, process.argv[2], new Date().toISOString().slice(0, 10)));
}
