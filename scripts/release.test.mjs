import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { prepareRelease } from './prepare-release.mjs';
import {
  assertReleaseTag,
  createReleaseChangelog,
  incrementVersion,
  validatePluginManifest,
} from './release-helpers.mjs';

const MANIFEST = { name: '@coderrob/eslint-plugin-zero-tolerance', version: '1.2.6' };
const CHANGELOG =
  '# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- Fix a rule.\n\n## [1.2.6] - 2026-08-06\n\n- Previous release.\n';

describe('plugin release tooling', () => {
  test('should increment only the requested semantic version component', () => {
    assert.equal(incrementVersion('1.2.6', 'major'), '2.0.0');
    assert.equal(incrementVersion('1.2.6', 'minor'), '1.3.0');
    assert.equal(incrementVersion('1.2.6', 'revision'), '1.2.7');
    assert.equal(incrementVersion('0.0.0', 'revision'), '0.0.1');
    assert.throws(() => incrementVersion('1.2.6', 'toString'), /Unsupported/u);
    assert.throws(() => incrementVersion('v1.2.6', 'minor'), /stable/u);
    assert.throws(() => incrementVersion('1.2.6-beta.1', 'minor'), /stable/u);
    assert.throws(() => incrementVersion('01.2.6', 'minor'), /stable/u);
  });

  test('should move release notes and retain earlier release history', () => {
    const output = createReleaseChangelog(CHANGELOG, '1.2.7', '2026-10-15');
    assert.equal(
      output,
      CHANGELOG.replace('## [Unreleased]', '## [Unreleased]\n\n## [1.2.7] - 2026-10-15'),
    );
    assert.equal(
      createReleaseChangelog('## [Unreleased]\n\n- First release.\n', '1.0.0', '2026-10-15'),
      '## [Unreleased]\n\n## [1.0.0] - 2026-10-15\n\n- First release.\n\n',
    );
    assert.throws(
      () => createReleaseChangelog('## [Unreleased]\n', '1.0.0', '2026-10-15'),
      /notes/u,
    );
    assert.throws(() => createReleaseChangelog('# Missing', '1.0.0', '2026-10-15'), /Missing/u);
    assert.throws(
      () => createReleaseChangelog(CHANGELOG, '1.2.6', '2026-10-15'),
      /already exists/u,
    );
  });

  test('should reject mismatched tags, non-plugin packages, and missing release notes', () => {
    assertReleaseTag('v1.2.6', MANIFEST, CHANGELOG);
    assertReleaseTag('v1.2.6', MANIFEST, CHANGELOG.replaceAll('\n', '\r\n'));
    for (const tag of ['1.2.6', 'v1.2.7', 'v1.2.6-beta.1', 'main', '--help']) {
      assert.throws(() => assertReleaseTag(tag, MANIFEST, CHANGELOG), /tag/u);
    }
    assert.throws(() => assertReleaseTag('v1.2.6', MANIFEST, '# Missing'), /changelog/u);
    assert.throws(() => validatePluginManifest({ ...MANIFEST, private: true }), /public plugin/u);
    assert.throws(
      () => validatePluginManifest({ ...MANIFEST, name: '@coderrob/eslint-config-zero-tolerance' }),
      /public plugin/u,
    );
    assert.throws(() => validatePluginManifest({ ...MANIFEST, version: 'next' }), /stable/u);
  });

  test('should prepare only the plugin and changelog while leaving invalid requests untouched', () => {
    const root = mkdtempSync(join(tmpdir(), 'zero-tolerance-release-'));
    try {
      mkdirSync(join(root, 'packages/plugin'), { recursive: true });
      mkdirSync(join(root, 'packages/config'), { recursive: true });
      writeFileSync(join(root, 'packages/plugin/package.json'), JSON.stringify(MANIFEST));
      writeFileSync(
        join(root, 'packages/config/package.json'),
        '{"version":"1.0.0","private":true}',
      );
      writeFileSync(join(root, 'CHANGELOG.md'), CHANGELOG);
      assert.throws(() => prepareRelease(root, 'invalid', '2026-10-15'), /Unsupported/u);
      assert.equal(
        readFileSync(join(root, 'packages/plugin/package.json'), 'utf8'),
        JSON.stringify(MANIFEST),
      );
      assert.equal(prepareRelease(root, 'revision', '2026-10-15'), '1.2.7');
      assert.equal(
        JSON.parse(readFileSync(join(root, 'packages/plugin/package.json'))).version,
        '1.2.7',
      );
      assert.equal(
        readFileSync(join(root, 'packages/config/package.json'), 'utf8'),
        '{"version":"1.0.0","private":true}',
      );
      assert.equal(
        readFileSync(join(root, 'CHANGELOG.md'), 'utf8'),
        createReleaseChangelog(CHANGELOG, '1.2.7', '2026-10-15'),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
