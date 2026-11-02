import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { nextVersion, rollChangelog, verifyReleaseMetadata } from './release-metadata.mjs';

const MANIFEST = { name: '@coderrob/eslint-plugin-zero-tolerance', version: '1.2.6' };

const changelog = [
  '# Changelog',
  '',
  '## [Unreleased]',
  '',
  '### Fixed',
  '',
  '- Preserved existing changes.',
  '',
  '## [1.2.6] - 2026-08-06',
  '',
  '- Previous release.',
  '',
].join('\n');

describe('plugin release metadata', () => {
  test('should bump major, minor, and revision versions independently', () => {
    assert.equal(nextVersion('1.2.6', 'major'), '2.0.0');
    assert.equal(nextVersion('1.2.6', 'minor'), '1.3.0');
    assert.equal(nextVersion('1.2.6', 'revision'), '1.2.7');
  });

  test('should reject invalid release sizes and versions', () => {
    assert.throws(() => nextVersion('1.2.6', 'patch'), /Invalid release size/u);
    assert.throws(() => nextVersion('1.2.6-rc.1', 'revision'), /Invalid plugin version/u);
    assert.throws(() => nextVersion('1.02.6', 'revision'), /Invalid plugin version/u);
    assert.throws(() => nextVersion('9007199254740992.0.0', 'major'), /Invalid plugin version/u);
  });

  test('should retain prior entries and move Unreleased changes to the new dated release', () => {
    const updated = rollChangelog(changelog, '1.2.6', '1.2.7', '2026-10-01');
    assert.match(updated, /## \[Unreleased\]\n\n## \[1\.2\.7\] - 2026-10-01\n\n### Fixed/u);
    assert.match(updated, /- Preserved existing changes\.\n\n## \[1\.2\.6\]/u);
    assert.equal(updated.split('- Preserved existing changes.').length, 2);
  });

  test('should preserve CRLF line endings when rolling the changelog', () => {
    const updated = rollChangelog(
      changelog.replaceAll('\n', '\r\n'),
      '1.2.6',
      '1.3.0',
      '2026-10-01',
    );
    assert.match(updated, /## \[Unreleased\]\r\n\r\n## \[1\.3\.0\] - 2026-10-01/u);
    assert.equal(updated.replaceAll('\r\n', '').includes('\n'), false);
  });

  test('should reject empty, duplicate, or stale Unreleased sections and invalid dates', () => {
    assert.throws(
      () =>
        rollChangelog(
          changelog.replace('- Preserved existing changes.', ''),
          '1.2.6',
          '1.2.7',
          '2026-10-01',
        ),
      /at least one change/u,
    );
    assert.throws(
      () =>
        rollChangelog(
          changelog.replace('## [1.2.6]', '## [Unreleased]'),
          '1.2.6',
          '1.2.7',
          '2026-10-01',
        ),
      /one Unreleased/u,
    );
    assert.throws(
      () => rollChangelog(changelog, '1.2.5', '1.2.7', '2026-10-01'),
      /Latest changelog release/u,
    );
    assert.throws(
      () => rollChangelog(changelog, '1.2.6', '1.2.7', '2026-02-30'),
      /Invalid release date/u,
    );
    assert.throws(
      () => rollChangelog(changelog, '1.2.6', '1.2.6', '2026-10-01'),
      /already contains/u,
    );
  });

  test('should accept only matching tags with a dated changelog release', () => {
    const prepared = rollChangelog(changelog, '1.2.6', '1.2.7', '2026-10-01');
    assert.doesNotThrow(() =>
      verifyReleaseMetadata({ ...MANIFEST, version: '1.2.7' }, prepared, 'v1.2.7'),
    );
    assert.throws(
      () => verifyReleaseMetadata({ ...MANIFEST, version: '1.2.7' }, prepared, 'v1.2.8'),
      /must match/u,
    );
    assert.throws(
      () => verifyReleaseMetadata({ ...MANIFEST, version: '1.2.7' }, changelog, 'v1.2.7'),
      /dated/u,
    );
    assert.throws(
      () => verifyReleaseMetadata({ ...MANIFEST, version: '1.2.7-rc.1' }, prepared, 'v1.2.7-rc.1'),
      /stable|must match/u,
    );
  });

  test('should prepare and verify fixture files without changing them after invalid input', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'plugin-release-'));
    const scriptPath = join(fixtureRoot, 'scripts', 'release-metadata.mjs');
    const manifestPath = join(fixtureRoot, 'packages', 'plugin', 'package.json');
    const changelogPath = join(fixtureRoot, 'CHANGELOG.md');
    try {
      mkdirSync(join(fixtureRoot, 'scripts'));
      mkdirSync(join(fixtureRoot, 'packages', 'plugin'), { recursive: true });
      copyFileSync(fileURLToPath(new URL('./release-metadata.mjs', import.meta.url)), scriptPath);
      copyFileSync(
        fileURLToPath(new URL('./release-helpers.mjs', import.meta.url)),
        join(fixtureRoot, 'scripts', 'release-helpers.mjs'),
      );
      writeFileSync(manifestPath, JSON.stringify(MANIFEST) + '\n');
      writeFileSync(changelogPath, changelog);

      const prepared = spawnSync(process.execPath, [
        scriptPath,
        'prepare',
        'revision',
        '2026-10-01',
      ]);
      assert.equal(prepared.status, 0, prepared.stderr.toString());
      assert.equal(prepared.stdout.toString().trim(), '1.2.7');
      assert.equal(JSON.parse(readFileSync(manifestPath, 'utf8')).version, '1.2.7');
      assert.match(readFileSync(changelogPath, 'utf8'), /## \[1\.2\.7\] - 2026-10-01/u);

      const verified = spawnSync(process.execPath, [scriptPath, 'verify', 'v1.2.7']);
      assert.equal(verified.status, 0, verified.stderr.toString());
      const beforeInvalid = [
        readFileSync(manifestPath, 'utf8'),
        readFileSync(changelogPath, 'utf8'),
      ];
      const invalidRequests = [
        ['prepare', 'major', '2026-02-30'],
        ['prepare', 'constructor', '2026-10-01'],
        ['prepare', 'major'],
        ['prepare', 'revision', '2026-10-01'],
        ['verify'],
        ['verify', 'v1.2.8'],
        ['unknown'],
      ];
      for (const request of invalidRequests) {
        const invalid = spawnSync(process.execPath, [scriptPath, ...request]);
        assert.notEqual(invalid.status, 0);
        assert.deepEqual(
          [readFileSync(manifestPath, 'utf8'), readFileSync(changelogPath, 'utf8')],
          beforeInvalid,
        );
      }
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  test('should reject inherited names and overflowing version increments without affecting later calls', () => {
    for (const size of ['constructor', 'toString', '__proto__', '', null, undefined]) {
      assert.throws(() => nextVersion('1.2.6', size), /Invalid release size/u);
    }
    assert.throws(() => nextVersion('9007199254740991.0.0', 'major'), /Invalid plugin version/u);
    assert.equal(nextVersion('0.0.0', 'revision'), '0.0.1');
    assert.equal(nextVersion('1.2.6', 'minor'), '1.3.0');
  });

  test('should reject decreasing or malformed release versions and permit leap-day dates', () => {
    assert.throws(() => rollChangelog(changelog, '1.2.6', '1.1.0', '2026-10-01'), /increase/u);
    assert.throws(
      () => rollChangelog(changelog, '1.2.6', 'next', '2026-10-01'),
      /Invalid plugin version/u,
    );
    assert.throws(
      () => rollChangelog(changelog, '1.2.6', '1.2.7', '2026-02-29'),
      /Invalid release date/u,
    );
    assert.match(rollChangelog(changelog, '1.2.6', '1.2.7', '2028-02-29'), /2028-02-29/u);
  });

  test('should reject private packages, stale or duplicate releases, invalid dates and empty notes', () => {
    const prepared = rollChangelog(changelog, '1.2.6', '1.2.7', '2026-10-01');
    const manifest = { ...MANIFEST, version: '1.2.7' };
    assert.throws(
      () => verifyReleaseMetadata({ ...manifest, private: true }, prepared, 'v1.2.7'),
      /public plugin/u,
    );
    assert.throws(
      () => verifyReleaseMetadata({ ...manifest, name: 'config' }, prepared, 'v1.2.7'),
      /public plugin/u,
    );
    assert.throws(
      () => verifyReleaseMetadata(manifest, prepared + '\n## [1.2.7] - 2026-10-01\n', 'v1.2.7'),
      /dated/u,
    );
    assert.throws(() => verifyReleaseMetadata(MANIFEST, prepared, 'v1.2.6'), /dated/u);
    assert.throws(
      () => verifyReleaseMetadata(manifest, prepared.replace('2026-10-01', '2026-02-30'), 'v1.2.7'),
      /Invalid release date/u,
    );
    assert.throws(
      () =>
        verifyReleaseMetadata(
          manifest,
          prepared.replace('- Preserved existing changes.', ''),
          'v1.2.7',
        ),
      /at least one change/u,
    );
    assert.doesNotThrow(() => verifyReleaseMetadata(manifest, prepared, 'v1.2.7'));
  });
});
