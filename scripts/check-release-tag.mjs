import { readFileSync } from 'node:fs';
import { assertReleaseTag } from './release-helpers.mjs';

const manifest = JSON.parse(
  readFileSync(new URL('../packages/plugin/package.json', import.meta.url), 'utf8'),
);
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
assertReleaseTag(process.argv[2], manifest, changelog);
