const { readFileSync } = require('node:fs');
const { basename } = require('node:path');
const { format, resolveConfig } = require('prettier');

const catalog = require('./scripts/metadata/readme-rule-catalog.json');

const RULE_LIST_START = '<!-- begin auto-generated rules list -->';
const RULE_LIST_END = '<!-- end auto-generated rules list -->';
const HERO_RULE_COUNT_PATTERN = /(<strong>)\d+( opinionated ESLint rules)/u;
const PACKAGE_RULE_COUNT_PATTERN = /(The ESLint plugin — )\d+( custom rules)/u;

/** Synchronizes handwritten rule-count references with the generated catalog. */
function applyRuleCount(content, ruleCount) {
  return content
    .replace(HERO_RULE_COUNT_PATTERN, `$1${String(ruleCount)}$2`)
    .replace(PACKAGE_RULE_COUNT_PATTERN, `$1${String(ruleCount)}$2`);
}

/** Builds the repository-specific overview prepended to the generated rule tables. */
function buildRuleOverview(ruleCount) {
  const categoryRows = catalog.categories
    .map(
      ({ focus, rules, title }) =>
        `| [${title}](#${title.toLowerCase().replaceAll(' ', '-')}) | ${String(rules.length)} | ${focus} |`,
    )
    .join('\n');

  return `
The plugin ships **${String(ruleCount)} rules** across ${String(catalog.categories.length)} categories. The grouped catalog below is exhaustive and links every rule to its dedicated documentation page.

Preset columns report the configured severity: 💼 for \`error\`, ⚠️ for \`warn\`, and 🚫 for \`off\`. A blank cell means the preset does not configure the rule.

| Category | Rules | Focus |
| --- | ---: | --- |
${categoryRows}
`;
}

/** @type {import('eslint-doc-generator').GenerateOptions} */
module.exports = {
  configEmoji: [
    ['legacy-recommended', 'R'],
    ['legacy-strict', 'S'],
  ],
  ignoreConfig: ['recommended', 'strict'],
  pathRuleDoc: '../../docs/rules/{name}.md',
  pathRuleList: '../../README.md',
  async postprocess(content, pathToFile) {
    if (basename(pathToFile) !== 'README.md') {
      return readFileSync(pathToFile, 'utf8');
    }

    const ruleCount = catalog.categories.reduce(
      (count, category) => count + category.rules.length,
      0,
    );
    const withOverview = applyRuleCount(content, ruleCount)
      .replace(RULE_LIST_START, `${RULE_LIST_START}\n${buildRuleOverview(ruleCount)}`)
      .replaceAll('`legacy-recommended`', '`recommended`')
      .replaceAll('`legacy-strict`', '`strict`');
    const startIndex = withOverview.indexOf(RULE_LIST_START);
    const endIndex = withOverview.indexOf(RULE_LIST_END) + RULE_LIST_END.length;
    const generatedSection = withOverview.slice(startIndex, endIndex);
    const prettierConfig = (await resolveConfig(pathToFile)) ?? {};
    const formattedSection = (
      await format(generatedSection, {
        ...prettierConfig,
        parser: 'markdown',
      })
    ).trim();

    return `${withOverview.slice(0, startIndex)}${formattedSection}${withOverview.slice(endIndex)}`;
  },
  ruleDocNotices: ['description'],
  ruleDocSectionOptions: false,
  ruleDocTitleFormat: 'name',
  ruleListColumns: ['name', 'type', 'configsError', 'configsWarn', 'configsOff', 'description'],
  ruleListSplit(rules) {
    const knownRules = new Set(catalog.categories.flatMap((category) => category.rules));
    const ungroupedRules = rules.filter(([name]) => !knownRules.has(name));
    if (ungroupedRules.length > 0) {
      throw new Error(
        `Rules missing from README categories: ${ungroupedRules.map(([name]) => name).join(', ')}`,
      );
    }

    return catalog.categories.map((category) => ({
      description: category.focus,
      rules: rules.filter(([name]) => category.rules.includes(name)),
      title: category.title,
    }));
  },
  urlRuleDoc(name, page) {
    return page.endsWith('README.md') ? `docs/rules/${name}.md` : undefined;
  },
};
