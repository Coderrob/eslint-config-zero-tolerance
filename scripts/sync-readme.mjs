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
 * Synchronizes README.md rule documentation from deterministic repository metadata.
 *
 * Source inputs:
 *   1. scripts/metadata/readme-rule-catalog.json - category ordering, focus text, rule grouping
 *   2. packages/plugin/src/rules/*.ts - canonical rule type and description metadata
 *   3. packages/plugin/src/rules/support/rule-map.ts - preset enablement state
 *   4. docs/rules/*.md - rule page existence checks for README links
 *
 * Use `--check` to verify that README.md is already synchronized without writing.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const README_PATH = join(REPO_ROOT, 'README.md');
const RULES_DIR = join(REPO_ROOT, 'packages', 'plugin', 'src', 'rules');
const RULE_MAP_PATH = join(REPO_ROOT, 'packages', 'plugin', 'src', 'rules', 'support', 'rule-map.ts');
const CATALOG_PATH = join(REPO_ROOT, 'scripts', 'metadata', 'readme-rule-catalog.json');
const DOCS_RULES_DIR = join(REPO_ROOT, 'docs', 'rules');
const GENERATED_START = '<!-- GENERATED:README_RULES_START -->';
const GENERATED_END = '<!-- GENERATED:README_RULES_END -->';
const CHECK_MODE = process.argv.includes('--check');
const PLUGIN_PACKAGE_ROW_PATTERN =
  /(\| \[`@coderrob\/eslint-plugin-zero-tolerance`\]\(https:\/\/www\.npmjs\.com\/package\/@coderrob\/eslint-plugin-zero-tolerance\) \| The ESLint plugin . )\d+( custom rules\s+\|)/u;
const HERO_COUNT_PATTERN = /(<strong>)\d+( opinionated ESLint rules for TypeScript teams that refuse to compromise on code quality\.<\/strong>)/u;

/**
 * Returns bold console text.
 *
 * @param {string} value - Text to format.
 * @returns {string} ANSI formatted text.
 */
function bold(value) {
  return `\u001B[1m${value}\u001B[0m`;
}

/**
 * Returns green console text.
 *
 * @param {string} value - Text to format.
 * @returns {string} ANSI formatted text.
 */
function green(value) {
  return `\u001B[32m${value}\u001B[0m`;
}

/**
 * Returns red console text.
 *
 * @param {string} value - Text to format.
 * @returns {string} ANSI formatted text.
 */
function red(value) {
  return `\u001B[31m${value}\u001B[0m`;
}

/**
 * Returns true when a node is an identifier with the requested text.
 *
 * @param {ts.Node | undefined} node - Candidate node.
 * @param {string} text - Expected identifier text.
 * @returns {boolean} True when the node matches.
 */
function isIdentifierNamed(node, text) {
  return node !== undefined && ts.isIdentifier(node) && node.text === text;
}

/**
 * Finds one object property assignment by name.
 *
 * @param {ts.ObjectLiteralExpression} objectLiteral - Object literal to inspect.
 * @param {string} propertyName - Property name.
 * @returns {ts.PropertyAssignment | null} Matching property assignment or null.
 */
function findPropertyAssignment(objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      ((ts.isIdentifier(property.name) && property.name.text === propertyName) ||
        (ts.isStringLiteral(property.name) && property.name.text === propertyName))
    ) {
      return property;
    }
  }
  return null;
}

/**
 * Evaluates a static string expression using the provided string constants map.
 *
 * @param {ts.Expression} expression - Expression to evaluate.
 * @param {Map<string, string>} stringConstants - In-scope string constants.
 * @returns {string | null} Static string value or null when unsupported.
 */
function evaluateStaticString(expression, stringConstants) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  if (ts.isIdentifier(expression)) {
    return stringConstants.get(expression.text) ?? null;
  }
  if (ts.isParenthesizedExpression(expression)) {
    return evaluateStaticString(expression.expression, stringConstants);
  }
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evaluateStaticString(expression.left, stringConstants);
    const right = evaluateStaticString(expression.right, stringConstants);
    return left === null || right === null ? null : `${left}${right}`;
  }
  if (ts.isTemplateExpression(expression)) {
    let value = expression.head.text;
    for (const span of expression.templateSpans) {
      const expressionValue = evaluateStaticString(span.expression, stringConstants);
      if (expressionValue === null) {
        return null;
      }
      value += expressionValue;
      value += span.literal.text;
    }
    return value;
  }
  return null;
}

/**
 * Collects top-level string constants from a source file.
 *
 * @param {ts.SourceFile} sourceFile - Source file to inspect.
 * @returns {Map<string, string>} String constants keyed by identifier.
 */
function collectTopLevelStringConstants(sourceFile) {
  const stringConstants = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer !== undefined
      ) {
        const value = evaluateStaticString(declaration.initializer, stringConstants);
        if (value !== null) {
          stringConstants.set(declaration.name.text, value);
        }
      }
    }
  }
  return stringConstants;
}

/**
 * Parses one rule source file and returns canonical README metadata for the rule.
 *
 * @param {string} ruleName - Canonical rule name.
 * @returns {{ name: string, type: string, description: string, docsPath: string }} Rule metadata.
 */
function parseRuleSourceMetadata(ruleName) {
  const rulePath = join(RULES_DIR, `${ruleName}.ts`);
  if (!existsSync(rulePath)) {
    throw new Error(`Missing rule source file: ${rulePath}`);
  }
  const sourceText = readFileSync(rulePath, 'utf8');
  const sourceFile = ts.createSourceFile(rulePath, sourceText, ts.ScriptTarget.Latest, true);
  const stringConstants = collectTopLevelStringConstants(sourceFile);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.initializer === undefined ||
        !ts.isCallExpression(declaration.initializer) ||
        !isIdentifierNamed(declaration.initializer.expression, 'createRule')
      ) {
        continue;
      }

      const [optionsArgument] = declaration.initializer.arguments;
      if (optionsArgument === undefined || !ts.isObjectLiteralExpression(optionsArgument)) {
        continue;
      }

      const nameProperty = findPropertyAssignment(optionsArgument, 'name');
      if (nameProperty === null) {
        continue;
      }
      const configuredRuleName = evaluateStaticString(nameProperty.initializer, stringConstants);
      if (configuredRuleName !== ruleName) {
        continue;
      }

      const metaProperty = findPropertyAssignment(optionsArgument, 'meta');
      if (metaProperty === null || !ts.isObjectLiteralExpression(metaProperty.initializer)) {
        throw new Error(`Rule ${ruleName} is missing a meta object`);
      }

      const typeProperty = findPropertyAssignment(metaProperty.initializer, 'type');
      const docsProperty = findPropertyAssignment(metaProperty.initializer, 'docs');
      if (
        typeProperty === null ||
        docsProperty === null ||
        !ts.isObjectLiteralExpression(docsProperty.initializer)
      ) {
        throw new Error(`Rule ${ruleName} is missing meta.type or meta.docs`);
      }

      const descriptionProperty = findPropertyAssignment(docsProperty.initializer, 'description');
      if (descriptionProperty === null) {
        throw new Error(`Rule ${ruleName} is missing meta.docs.description`);
      }

      const type = evaluateStaticString(typeProperty.initializer, stringConstants);
      const description = evaluateStaticString(descriptionProperty.initializer, stringConstants);
      if (type === null || description === null) {
        throw new Error(`Rule ${ruleName} uses non-static metadata that README sync cannot evaluate`);
      }

      const docsPath = `docs/rules/${ruleName}.md`;
      if (!existsSync(join(REPO_ROOT, docsPath))) {
        throw new Error(`Rule ${ruleName} is missing its docs page at ${docsPath}`);
      }

      return { name: ruleName, type, description, docsPath };
    }
  }

  throw new Error(`Unable to locate createRule metadata for ${ruleName}`);
}

/**
 * Resolves a static rule name string from a rule-map expression.
 *
 * @param {ts.Expression} expression - Expression to evaluate.
 * @param {Map<string, string>} stringConstants - Available string constants.
 * @returns {string | null} Canonical rule name or null.
 */
function resolveRuleName(expression, stringConstants) {
  return evaluateStaticString(expression, stringConstants);
}

/**
 * Resolves a preset severity value from a rule-map expression.
 *
 * @param {ts.Expression} expression - Expression to evaluate.
 * @param {Map<string, string>} stringConstants - Available string constants.
 * @returns {string | null} Severity string or null.
 */
function resolveSeverity(expression, stringConstants) {
  if (ts.isArrayLiteralExpression(expression) && expression.elements.length > 0) {
    const [firstElement] = expression.elements;
    return ts.isExpression(firstElement) ? evaluateStaticString(firstElement, stringConstants) : null;
  }
  return evaluateStaticString(expression, stringConstants);
}

/**
 * Classifies README preset text from recommended and strict severities.
 *
 * @param {string} recommended - Recommended preset severity.
 * @param {string} strict - Strict preset severity.
 * @returns {"Both" | "Strict only" | "Opt-in"} README preset label.
 */
function classifyPreset(recommended, strict) {
  if (recommended === 'off' && strict === 'off') {
    return 'Opt-in';
  }
  if (recommended === 'off' && strict !== 'off') {
    return 'Strict only';
  }
  return 'Both';
}

/**
 * Parses rule preset metadata from rule-map.ts.
 *
 * @returns {Map<string, "Both" | "Strict only" | "Opt-in">} README preset labels keyed by rule name.
 */
function parseRulePresetMetadata() {
  const sourceText = readFileSync(RULE_MAP_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(RULE_MAP_PATH, sourceText, ts.ScriptTarget.Latest, true);
  const stringConstants = collectTopLevelStringConstants(sourceFile);
  const defaultRuleNames = [];
  const presetByRuleName = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.initializer === undefined) {
        continue;
      }
      if (
        declaration.name.text === 'DEFAULT_RULE_NAMES' &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        for (const element of declaration.initializer.elements) {
          if (!ts.isExpression(element)) {
            continue;
          }
          const ruleName = evaluateStaticString(element, stringConstants);
          if (ruleName !== null) {
            defaultRuleNames.push(ruleName);
          }
        }
      }
      if (
        declaration.name.text === 'ruleEntries' &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        for (const element of declaration.initializer.elements) {
          if (ts.isSpreadElement(element)) {
            for (const ruleName of defaultRuleNames) {
              presetByRuleName.set(ruleName, 'Both');
            }
            continue;
          }
          if (!ts.isCallExpression(element) || !isIdentifierNamed(element.expression, 'createRuleEntry')) {
            continue;
          }
          const [nameArgument, recommendedArgument, strictArgument] = element.arguments;
          if (
            nameArgument === undefined ||
            recommendedArgument === undefined ||
            strictArgument === undefined
          ) {
            continue;
          }
          const ruleName = resolveRuleName(nameArgument, stringConstants);
          const recommended = resolveSeverity(recommendedArgument, stringConstants);
          const strict = resolveSeverity(strictArgument, stringConstants);
          if (ruleName === null || recommended === null || strict === null) {
            throw new Error(`Unable to resolve preset metadata for a rule in ${RULE_MAP_PATH}`);
          }
          presetByRuleName.set(ruleName, classifyPreset(recommended, strict));
        }
      }
    }
  }

  return presetByRuleName;
}

/**
 * Loads and validates README category metadata.
 *
 * @returns {{ categories: Array<{ title: string, focus: string, rules: string[] }> }} Parsed catalog.
 */
function loadCatalogMetadata() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  if (
    typeof catalog !== 'object' ||
    catalog === null ||
    !Array.isArray(catalog.categories)
  ) {
    throw new Error(`Invalid README catalog metadata at ${CATALOG_PATH}`);
  }
  return catalog;
}

/**
 * Builds the README rules section from metadata.
 *
 * @param {{ categories: Array<{ title: string, focus: string, rules: string[] }> }} catalog - README catalog metadata.
 * @param {Map<string, { name: string, type: string, description: string, docsPath: string }>} ruleMetadata - Rule metadata keyed by rule name.
 * @param {Map<string, "Both" | "Strict only" | "Opt-in">} presets - Rule preset labels keyed by rule name.
 * @returns {{ section: string, ruleCount: number }} Generated section and total rule count.
 */
function buildRulesSection(catalog, ruleMetadata, presets) {
  const discoveredRuleNames = new Set(ruleMetadata.keys());
  const catalogRuleNames = new Set();

  const categorySummaryRows = catalog.categories.map((category) => {
    for (const ruleName of category.rules) {
      if (catalogRuleNames.has(ruleName)) {
        throw new Error(`README catalog duplicates rule ${ruleName}`);
      }
      if (!discoveredRuleNames.has(ruleName)) {
        throw new Error(`README catalog references unknown rule ${ruleName}`);
      }
      catalogRuleNames.add(ruleName);
    }
    return `| [${category.title}](#${category.title.toLowerCase().replace(/\s+/gu, '-')}) | ${String(category.rules.length).padStart(5, ' ')} | ${category.focus} |`;
  });

  const missingFromCatalog = [...discoveredRuleNames].filter((ruleName) => !catalogRuleNames.has(ruleName));
  if (missingFromCatalog.length > 0) {
    throw new Error(`README catalog is missing rules: ${missingFromCatalog.join(', ')}`);
  }

  const categorySections = catalog.categories
    .map((category) => {
      const rows = category.rules.map((ruleName) => {
        const metadata = ruleMetadata.get(ruleName);
        const preset = presets.get(ruleName);
        if (metadata === undefined || preset === undefined) {
          throw new Error(`Missing metadata for rule ${ruleName}`);
        }
        return `| [\`${ruleName}\`](${metadata.docsPath}) | \`${metadata.type}\` | ${preset} | ${metadata.description} |`;
      });
      return [
        `### ${category.title}`,
        '',
        '| Rule | Type | Preset | Description |',
        '| ---- | ---- | ------ | ----------- |',
        ...rows,
      ].join('\n');
    })
    .join('\n\n');

  const ruleCount = catalogRuleNames.size;
  const section = [
    '## Rules',
    '',
    `The plugin ships **${ruleCount} rules** across ${catalog.categories.length} categories. The grouped catalog below is exhaustive and links every rule to its dedicated documentation page.`,
    '',
    'Preset legend:',
    '',
    '- `Both` = enabled by both `recommended` and `strict`',
    '- `Strict only` = enabled only by `strict`',
    '- `Opt-in` = not enabled by either preset',
    '',
    '| Category | Rules | Focus |',
    '| -------- | ----: | ----- |',
    ...categorySummaryRows,
    '',
    categorySections,
  ].join('\n');

  return { section, ruleCount };
}

/**
 * Replaces or inserts the generated README rules section between stable markers.
 *
 * @param {string} readmeContent - Current README content.
 * @param {string} rulesSection - Generated rules section.
 * @returns {string} README with the generated block applied.
 */
function applyGeneratedRulesSection(readmeContent, rulesSection) {
  const generatedBlock = `${GENERATED_START}\n${rulesSection}\n${GENERATED_END}`;
  if (readmeContent.includes(GENERATED_START) && readmeContent.includes(GENERATED_END)) {
    return readmeContent.replace(
      new RegExp(`${GENERATED_START}[\\s\\S]*?${GENERATED_END}`, 'u'),
      generatedBlock,
    );
  }

  const rulesHeadingIndex = readmeContent.indexOf('## Rules');
  const developmentHeadingIndex = readmeContent.indexOf('## Development');
  if (rulesHeadingIndex === -1 || developmentHeadingIndex === -1 || developmentHeadingIndex <= rulesHeadingIndex) {
    throw new Error('README.md is missing the expected "## Rules" or "## Development" headings');
  }

  return `${readmeContent.slice(0, rulesHeadingIndex)}${generatedBlock}\n\n${readmeContent.slice(developmentHeadingIndex)}`;
}

/**
 * Applies deterministic rule-count replacements outside the generated rules block.
 *
 * @param {string} readmeContent - README content.
 * @param {number} ruleCount - Canonical rule count.
 * @returns {string} Updated README content.
 */
function applyRuleCountReplacements(readmeContent, ruleCount) {
  if (!HERO_COUNT_PATTERN.test(readmeContent)) {
    throw new Error('README.md is missing the expected hero rule-count pattern');
  }
  if (!PLUGIN_PACKAGE_ROW_PATTERN.test(readmeContent)) {
    throw new Error('README.md is missing the expected package-table rule-count pattern');
  }

  let updatedContent = readmeContent.replace(HERO_COUNT_PATTERN, `$1${ruleCount}$2`);
  updatedContent = updatedContent.replace(PLUGIN_PACKAGE_ROW_PATTERN, `$1${ruleCount}$2`);
  return updatedContent;
}

/**
 * Main entrypoint for README synchronization.
 */
function main() {
  console.log(bold(`${CHECK_MODE ? 'Checking' : 'Synchronizing'} README.md from deterministic metadata...`));

  const catalog = loadCatalogMetadata();
  const presets = parseRulePresetMetadata();
  const ruleMetadata = new Map(
    [...presets.keys()].sort().map((ruleName) => [ruleName, parseRuleSourceMetadata(ruleName)]),
  );

  const { section, ruleCount } = buildRulesSection(catalog, ruleMetadata, presets);
  const currentReadme = readFileSync(README_PATH, 'utf8');
  const syncedReadme = applyRuleCountReplacements(
    applyGeneratedRulesSection(currentReadme, section),
    ruleCount,
  );

  if (syncedReadme === currentReadme) {
    console.log(green(`\n✓ README.md already matches deterministic rule metadata (${ruleCount} rules).`));
    return;
  }

  if (CHECK_MODE) {
    console.error(red('\nREADME.md is out of date. Run `pnpm readme:sync` to regenerate it.'));
    process.exitCode = 1;
    return;
  }

  writeFileSync(README_PATH, syncedReadme);
  console.log(green(`\n✓ Updated README.md from deterministic rule metadata (${ruleCount} rules).`));
}

main();
