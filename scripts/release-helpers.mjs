const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const PLUGIN_NAME = '@coderrob/eslint-plugin-zero-tolerance';
const UNRELEASED_HEADING = '## [Unreleased]';

/**
 * Computes a stable plugin version for a supported release increment.
 *
 * @param version - Current stable semantic version.
 * @param bump - Major, minor, or revision increment.
 * @returns Incremented semantic version.
 * @throws {Error} When the version or increment is unsupported.
 */
export function incrementVersion(version, bump) {
  const [major, minor, patch] = parseVersionParts(version);
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'revision':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unsupported release increment: ${bump}`);
  }
}

/**
 * Parses a stable semantic version into numeric components.
 *
 * @param version - Stable semantic version text.
 * @returns Major, minor, and patch components.
 * @throws {Error} When the input is not a stable semantic version.
 */
function parseVersionParts(version) {
  if (!STABLE_VERSION.test(version)) throw new Error('Expected a stable semantic version.');
  return version.split('.').map(Number);
}

/**
 * Moves pending notes into a dated release section, retaining an empty Unreleased section.
 *
 * @param changelog - Current changelog content.
 * @param version - Release version.
 * @param date - Release date in YYYY-MM-DD format.
 * @returns Updated changelog content.
 * @throws {Error} When notes are missing or the release already exists.
 */
export function createReleaseChangelog(changelog, version, date) {
  const headingIndex = changelog.indexOf(UNRELEASED_HEADING);
  if (headingIndex < 0) throw new Error('Missing Unreleased changelog section.');
  if (changelog.includes(`## [${version}]`))
    throw new Error('Release already exists in changelog.');
  return moveReleaseNotes(changelog, headingIndex, version, date);
}

/**
 * Extracts pending notes and inserts the release heading before previous releases.
 *
 * @param changelog - Original changelog.
 * @param headingIndex - Offset of the Unreleased heading.
 * @param version - Release version.
 * @param date - Release date.
 * @returns Changelog with moved release notes.
 * @throws {Error} When the pending section contains no release notes.
 */
function moveReleaseNotes(changelog, headingIndex, version, date) {
  const remainder = changelog.slice(headingIndex + UNRELEASED_HEADING.length);
  const nextHeading = remainder.search(/^## \[/mu);
  const notes = (nextHeading < 0 ? remainder : remainder.slice(0, nextHeading)).trim();
  if (!/^- /mu.test(notes)) throw new Error('Unreleased must contain release notes.');
  const history = nextHeading < 0 ? '' : remainder.slice(nextHeading);
  return `${changelog.slice(0, headingIndex)}${UNRELEASED_HEADING}\n\n## [${version}] - ${date}\n\n${notes}\n\n${history}`;
}

/**
 * Validates the only package permitted in this repository's npm release workflow.
 *
 * @param manifest - Plugin package manifest.
 * @returns Validated plugin version.
 * @throws {Error} When the manifest names the wrong package or is not publishable.
 */
export function validatePluginManifest(manifest) {
  if (manifest.name !== PLUGIN_NAME || manifest.private)
    throw new Error('Expected the public plugin package.');
  if (!STABLE_VERSION.test(manifest.version)) throw new Error('Expected a stable plugin version.');
  return manifest.version;
}

/**
 * Checks that a release tag matches the public plugin and dated release notes.
 *
 * @param tag - Git release tag.
 * @param manifest - Plugin package manifest.
 * @param changelog - Changelog at the tagged commit.
 * @throws {Error} When the tag or release notes do not match the plugin version.
 */
export function assertReleaseTag(tag, manifest, changelog) {
  const version = validatePluginManifest(manifest);
  if (tag !== `v${version}`) throw new Error('Release tag must match the plugin version.');
  const heading = new RegExp(
    String.raw`^## \[${version.replaceAll('.', '\\.')}\] - \d{4}-\d{2}-\d{2}$`,
    'mu',
  );
  if (!heading.test(changelog.replaceAll('\r\n', '\n')))
    throw new Error('Missing dated release changelog.');
}
