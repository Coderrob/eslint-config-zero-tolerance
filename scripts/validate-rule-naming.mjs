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
 * Validates that every ESLint rule follows the repository's naming and wiring
 * conventions.
 *
 * Checks performed:
 *   1. Rule source filenames use supported kebab-case prefixes.
 *   2. The exported rule constant matches the filename in camelCase.
 *   3. The createRule name matches the filename exactly.
 *   4. The default export matches the named rule constant.
 *   5. The sibling test, BDD spec, and docs files exist and use matching names.
 *   6. The plugin index and preset rule map reference the same canonical rule name.
 *
 * Exits with code 0 on success, 1 on any validation failure.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const RULES_DIR = join(REPO_ROOT, 'packages', 'plugin', 'src', 'rules');
const DOCS_RULES_DIR = join(REPO_ROOT, 'docs', 'rules');
const PLUGIN_INDEX_PATH = join(REPO_ROOT, 'packages', 'plugin', 'src', 'index.ts');
const RULE_MAP_PATH = join(
  REPO_ROOT,
  'packages',
  'plugin',
  'src',
  'rules',
  'support',
  'rule-map.ts',
);
const RULE_SOURCE_SUFFIX = '.ts';
const RULE_TEST_SUFFIX = '.test.ts';
const RULE_BDD_SUFFIX = '.ts.bdd.json';
const RULE_DOCS_SUFFIX = '.md';
const RULE_NAME_PATTERN = /^(?:max|no|prefer|require|sort)-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Returns ANSI-styled bold text.
 *
 * @param {string} text - Text to format.
 * @returns {string} Styled text.
 */
function bold(text) {
  return `\u001B[1m${text}\u001B[0m`;
}

/**
 * Returns ANSI-styled green text.
 *
 * @param {string} text - Text to format.
 * @returns {string} Styled text.
 */
function green(text) {
  return `\u001B[32m${text}\u001B[0m`;
}

/**
 * Returns ANSI-styled red text.
 *
 * @param {string} text - Text to format.
 * @returns {string} Styled text.
 */
function red(text) {
  return `\u001B[31m${text}\u001B[0m`;
}

/**
 * Returns all direct rule source files under the rules directory.
 *
 * @returns {string[]} Absolute paths of rule implementation files.
 */
function collectRuleSourceFiles() {
  return readdirSync(RULES_DIR)
    .filter(
      (name) =>
        name.endsWith(RULE_SOURCE_SUFFIX) &&
        !name.endsWith(RULE_TEST_SUFFIX) &&
        !name.endsWith(RULE_BDD_SUFFIX),
    )
    .map((name) => join(RULES_DIR, name))
    .sort();
}

/**
 * Converts a kebab-case rule name to its expected camelCase export name.
 *
 * @param {string} ruleName - Kebab-case rule name.
 * @returns {string} CamelCase export identifier.
 */
function toCamelCase(ruleName) {
  return ruleName.replace(/-([a-z0-9])/gu, (_, character) => character.toUpperCase());
}

/**
 * Extracts the exported rule constant name from one rule source file.
 *
 * @param {string} content - Rule source text.
 * @returns {string | null} Exported rule constant or null when not found.
 */
function extractNamedRuleExport(content) {
  const match = /export const (\w+)\s*=\s*createRule\(\{/u.exec(content);
  return match === null ? null : match[1];
}

/**
 * Extracts the createRule name property from one rule source file.
 *
 * @param {string} content - Rule source text.
 * @returns {string | null} Rule name or null when not found.
 */
function extractConfiguredRuleName(content) {
  const match = /export const \w+\s*=\s*createRule\(\{[\s\S]*?\bname:\s*'([^']+)'/u.exec(content);
  return match === null ? null : match[1];
}

/**
 * Extracts the default export identifier from one rule source file.
 *
 * @param {string} content - Rule source text.
 * @returns {string | null} Default export identifier or null when not found.
 */
function extractDefaultExport(content) {
  const match = /export default (\w+);/u.exec(content);
  return match === null ? null : match[1];
}

/**
 * Returns the first markdown heading from a docs file.
 *
 * @param {string} content - Markdown file text.
 * @returns {string | null} First heading text or null when absent.
 */
function extractFirstHeading(content) {
  const match = /^# (.+)$/mu.exec(content);
  return match === null ? null : match[1];
}

/**
 * Returns true when the plugin index imports the rule with the expected local identifier.
 *
 * @param {string} pluginIndexContent - Plugin index source text.
 * @param {string} ruleName - Canonical rule name.
 * @param {string} exportName - Expected local identifier.
 * @returns {boolean} True when the import statement exists.
 */
function hasPluginIndexImport(pluginIndexContent, ruleName, exportName) {
  const pattern = new RegExp(`import ${exportName} from './rules/${ruleName}';`, 'u');
  return pattern.test(pluginIndexContent);
}

/**
 * Returns true when the plugin rules map contains the canonical rule key and local identifier.
 *
 * @param {string} pluginIndexContent - Plugin index source text.
 * @param {string} ruleName - Canonical rule name.
 * @param {string} exportName - Expected local identifier.
 * @returns {boolean} True when the rules map entry exists.
 */
function hasPluginIndexRuleEntry(pluginIndexContent, ruleName, exportName) {
  const pattern = new RegExp(`'${ruleName}': ${exportName},`, 'u');
  return pattern.test(pluginIndexContent);
}

/**
 * Returns true when the preset rule map references the canonical rule name.
 *
 * @param {string} ruleMapContent - Rule map source text.
 * @param {string} ruleName - Canonical rule name.
 * @returns {boolean} True when the rule name appears in the rule map source.
 */
function hasRuleMapEntry(ruleMapContent, ruleName) {
  const pattern = new RegExp(`'${ruleName}'`, 'u');
  return pattern.test(ruleMapContent);
}

/**
 * Returns true when a test file imports the expected named rule export from its sibling rule file.
 *
 * @param {string} testContent - Test source text.
 * @param {string} ruleName - Canonical rule name.
 * @param {string} exportName - Expected named export.
 * @returns {boolean} True when the import statement exists.
 */
function hasNamedRuleImport(testContent, ruleName, exportName) {
  const pattern = new RegExp(
    String.raw`import\s*\{[\s\S]*?\b${exportName}\b[\s\S]*?\}\s*from\s*'\./${ruleName}';`,
    'u',
  );
  return pattern.test(testContent);
}

/**
 * Returns true when a test file registers a rule tester suite under the canonical rule name.
 *
 * @param {string} testContent - Test source text.
 * @param {string} ruleName - Canonical rule name.
 * @returns {boolean} True when at least one suite name starts with the canonical rule name.
 */
function hasCanonicalRuleTesterRun(testContent, ruleName) {
  const pattern = new RegExp(String.raw`\.run\('${ruleName}(?:'|\s)`, 'u');
  return pattern.test(testContent);
}

/**
 * Validates one rule implementation and returns any failures.
 *
 * @param {string} rulePath - Absolute path to the rule source file.
 * @param {string} pluginIndexContent - Plugin index source text.
 * @param {string} ruleMapContent - Rule map source text.
 * @returns {string[]} Validation failures for the rule.
 */
function validateRule(rulePath, pluginIndexContent, ruleMapContent) {
  const failures = [];
  const filename = basename(rulePath);
  const ruleName = filename.slice(0, -RULE_SOURCE_SUFFIX.length);
  const expectedExportName = toCamelCase(ruleName);
  const sourceContent = readFileSync(rulePath, 'utf8');
  const namedExport = extractNamedRuleExport(sourceContent);
  const configuredRuleName = extractConfiguredRuleName(sourceContent);
  const defaultExport = extractDefaultExport(sourceContent);
  const testPath = join(RULES_DIR, `${ruleName}${RULE_TEST_SUFFIX}`);
  const bddPath = join(RULES_DIR, `${ruleName}${RULE_BDD_SUFFIX}`);
  const docsPath = join(DOCS_RULES_DIR, `${ruleName}${RULE_DOCS_SUFFIX}`);

  if (!RULE_NAME_PATTERN.test(ruleName)) {
    failures.push(
      `${filename}: rule filename must use kebab-case with one of the supported prefixes (max-, no-, prefer-, require-, sort-)`,
    );
  }

  if (namedExport !== expectedExportName) {
    failures.push(
      `${filename}: named export must be "${expectedExportName}" to match the filename`,
    );
  }

  if (configuredRuleName !== ruleName) {
    failures.push(`${filename}: createRule name must be "${ruleName}"`);
  }

  if (defaultExport !== expectedExportName) {
    failures.push(
      `${filename}: default export must be "${expectedExportName}" to match the named rule export`,
    );
  }

  if (existsSync(testPath)) {
    const testContent = readFileSync(testPath, 'utf8');
    if (!hasNamedRuleImport(testContent, ruleName, expectedExportName)) {
      failures.push(
        `${filename}: test file must import the named rule export "${expectedExportName}" from "./${ruleName}"`,
      );
    }
    if (!hasCanonicalRuleTesterRun(testContent, ruleName)) {
      failures.push(
        `${filename}: test file must register at least one rule tester suite whose name starts with "${ruleName}"`,
      );
    }
  } else {
    failures.push(`${filename}: missing sibling test file "${ruleName}${RULE_TEST_SUFFIX}"`);
  }

  if (!existsSync(bddPath)) {
    failures.push(`${filename}: missing sibling BDD spec "${ruleName}${RULE_BDD_SUFFIX}"`);
  }

  if (existsSync(docsPath)) {
    const docsHeading = extractFirstHeading(readFileSync(docsPath, 'utf8'));
    if (docsHeading !== ruleName) {
      failures.push(`${filename}: docs page heading must be "# ${ruleName}"`);
    }
  } else {
    failures.push(`${filename}: missing docs page "docs/rules/${ruleName}.md"`);
  }

  if (!hasPluginIndexImport(pluginIndexContent, ruleName, expectedExportName)) {
    failures.push(
      `${filename}: plugin index must import "${expectedExportName}" from "./rules/${ruleName}"`,
    );
  }

  if (!hasPluginIndexRuleEntry(pluginIndexContent, ruleName, expectedExportName)) {
    failures.push(
      `${filename}: plugin index rules map must register "${ruleName}" with "${expectedExportName}"`,
    );
  }

  if (!hasRuleMapEntry(ruleMapContent, ruleName)) {
    failures.push(`${filename}: preset rule map must reference "${ruleName}"`);
  }

  return failures;
}

/**
 * Prints validation failures with a stable, readable layout.
 *
 * @param {string[]} failures - Validation failures.
 */
function printFailures(failures) {
  console.error(bold(red(`\nRule naming validation failed (${failures.length} issue(s)):`)));
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
}

/**
 * Runs rule naming validation for every plugin rule file.
 */
function main() {
  console.log(bold('Validating rule naming conventions...'));

  const pluginIndexContent = readFileSync(PLUGIN_INDEX_PATH, 'utf8');
  const ruleMapContent = readFileSync(RULE_MAP_PATH, 'utf8');
  const ruleSourceFiles = collectRuleSourceFiles();
  const failures = ruleSourceFiles.flatMap((rulePath) =>
    validateRule(rulePath, pluginIndexContent, ruleMapContent),
  );

  if (failures.length > 0) {
    printFailures(failures);
    process.exitCode = 1;
    return;
  }

  console.log(green(`\n✓ All ${ruleSourceFiles.length} rule file(s) follow naming conventions.`));
}

main();
