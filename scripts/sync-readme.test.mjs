import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyGeneratedRulesSection,
  applyRuleCountReplacements,
  formatRulesSection,
  synchronizeReadmeContent,
  synchronizeReadmeFile,
} from './sync-readme.mjs';

const START_MARKER = '<!-- GENERATED:README_RULES_START -->';
const END_MARKER = '<!-- GENERATED:README_RULES_END -->';
const RULES_SECTION = [
  '## Rules',
  '',
  '| Rule | Type |',
  '| --- | --- |',
  '| `short` | `problem` |',
].join('\n');

function createReadme(ruleCount = 76, generatedSection = 'stale') {
  return [
    '<div><strong>' +
      `${ruleCount} opinionated ESLint rules for TypeScript teams that refuse to compromise on code quality.` +
      '</strong></div>',
    '',
    '| Package | Description |',
    '| --- | --- |',
    '| [`@coderrob/eslint-plugin-zero-tolerance`](https://www.npmjs.com/package/@coderrob/eslint-plugin-zero-tolerance) | ' +
      `The ESLint plugin — ${ruleCount} custom rules |`,
    '',
    'Handwritten text   with intentional spacing.',
    START_MARKER,
    generatedSection,
    END_MARKER,
    'Handwritten tail.',
    '',
  ].join('\n');
}

test('should synchronize idempotently and detect current content', async () => {
  const initialReadme = createReadme();
  const formatter = async (value) => value;
  const synchronized = await synchronizeReadmeContent(initialReadme, RULES_SECTION, 77, formatter);
  const repeated = await synchronizeReadmeContent(synchronized, RULES_SECTION, 77, formatter);

  assert.equal(repeated, synchronized);
  let writes = 0;
  const isCurrent = await synchronizeReadmeFile({
    checkMode: true,
    readFile: () => synchronized,
    ruleCount: 77,
    rulesSection: RULES_SECTION,
    sectionFormatter: formatter,
    writeFile: () => {
      writes += 1;
    },
  });
  assert.equal(isCurrent, true);
  assert.equal(writes, 0);
});

test('should preserve handwritten content outside the generated block', () => {
  const current = createReadme(77);
  const updated = applyGeneratedRulesSection(current, RULES_SECTION);
  const currentPrefix = current.slice(0, current.indexOf(START_MARKER));
  const currentSuffix = current.slice(current.indexOf(END_MARKER) + END_MARKER.length);

  assert.equal(updated.slice(0, updated.indexOf(START_MARKER)), currentPrefix);
  assert.equal(updated.slice(updated.indexOf(END_MARKER) + END_MARKER.length), currentSuffix);
});

test('should format only the generated rules section', async () => {
  const formatted = await formatRulesSection(RULES_SECTION, {
    readmePath: 'README.md',
    resolvePrettierConfig: async () => ({ proseWrap: 'preserve' }),
  });

  assert.match(formatted, /\| Rule\s+\| Type\s+\|/u);
  assert.equal(formatted.endsWith('\n'), false);
});

test('should use Prettier defaults when configuration is missing', async () => {
  let receivedOptions;
  const formatted = await formatRulesSection('rules', {
    formatMarkdown: async (_content, options) => {
      receivedOptions = options;
      return 'formatted\n';
    },
    readmePath: 'README.md',
    resolvePrettierConfig: async () => null,
  });

  assert.equal(formatted, 'formatted');
  assert.deepEqual(receivedOptions, { filepath: 'README.md' });
});

test('should not write partial content when formatting fails', async () => {
  let writes = 0;
  await assert.rejects(
    synchronizeReadmeFile({
      checkMode: false,
      readFile: () => createReadme(),
      ruleCount: 77,
      rulesSection: RULES_SECTION,
      sectionFormatter: async () => {
        throw new Error('format failed');
      },
      writeFile: () => {
        writes += 1;
      },
    }),
    /format failed/u,
  );
  assert.equal(writes, 0);
});

test('should reject missing, duplicated, and reversed generated markers', () => {
  assert.throws(
    () => applyGeneratedRulesSection('README without markers', RULES_SECTION),
    /markers/u,
  );
  assert.throws(
    () =>
      applyGeneratedRulesSection(`${START_MARKER}\n${START_MARKER}\n${END_MARKER}`, RULES_SECTION),
    /markers/u,
  );
  assert.throws(
    () => applyGeneratedRulesSection(`${END_MARKER}\n${START_MARKER}`, RULES_SECTION),
    /markers/u,
  );
});

test('should replace hero and plugin package rule counts', () => {
  const updated = applyRuleCountReplacements(createReadme(76), 77);

  assert.match(updated, /<strong>77 opinionated ESLint rules/u);
  assert.match(updated, /The ESLint plugin — 77 custom rules/u);
  assert.doesNotMatch(updated, /76 (?:opinionated|custom)/u);
});

test('should report stale content in check mode without writing', async () => {
  let writes = 0;
  const isCurrent = await synchronizeReadmeFile({
    checkMode: true,
    readFile: () => createReadme(),
    ruleCount: 77,
    rulesSection: RULES_SECTION,
    sectionFormatter: async (value) => value,
    writeFile: () => {
      writes += 1;
    },
  });

  assert.equal(isCurrent, false);
  assert.equal(writes, 0);
});
