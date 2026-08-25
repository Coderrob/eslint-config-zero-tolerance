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
 * Enforces repository relationships not covered by eslint-plugin-eslint-plugin,
 * eslint-doc-generator, the BDD validator, or rule unit tests.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..');
const RULES_DIR = join(REPO_ROOT, 'packages', 'plugin', 'src', 'rules');
const BUILT_PLUGIN_PATH = join(REPO_ROOT, 'packages', 'plugin', 'dist', 'index.mjs');
const RULE_TEST_SUFFIX = '.test.ts';
const RULE_NAME_PATTERN = /^(?:max|no|prefer|require|sort)-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Returns missing RuleTester fixture-group diagnostics.
 *
 * @param ruleName - Canonical rule name.
 * @param testContent - Rule test source text.
 * @returns Missing fixture-group diagnostics.
 */
function validateFixtureGroups(ruleName, testContent) {
  return ['valid', 'invalid']
    .filter((groupName) => !new RegExp(String.raw`\b${groupName}\s*:\s*\[`, 'u').test(testContent))
    .map((groupName) => `${ruleName}.ts: test file must contain ${groupName} RuleTester fixtures`);
}

/**
 * Returns behavior-style fixture-name diagnostics.
 *
 * @param ruleName - Canonical rule name.
 * @param testContent - Rule test source text.
 * @returns Invalid fixture-name diagnostics.
 */
function validateFixtureNames(ruleName, testContent) {
  const suiteStart = testContent.indexOf('.run(');
  const suiteContent = suiteStart === -1 ? testContent : testContent.slice(suiteStart);
  const names = [...suiteContent.matchAll(/^ {8}name:\s*(['"`])([^'"`]+)\1,?$/gmu)].map(
    (match) => match[2],
  );
  return names
    .filter((name) => !name.startsWith('should'))
    .map((name) => `${ruleName}.ts: test description must start with "should": "${name}"`);
}

/**
 * Returns an autofix-output fixture diagnostic when required.
 *
 * @param ruleName - Canonical rule name.
 * @param sourceContent - Rule implementation source text.
 * @param testContent - Rule test source text.
 * @returns Missing autofix-output diagnostics.
 */
function validateFixableOutput(ruleName, sourceContent, testContent) {
  const isFixable = /\bfixable:\s*['"]code['"]/u.test(sourceContent);
  const hasOutput = /\boutput\s*:/u.test(testContent);
  return isFixable && !hasOutput
    ? [`${ruleName}.ts: fixable rule must assert at least one autofix output fixture`]
    : [];
}

/**
 * Validates the behavioral fixture contract for one rule suite.
 *
 * @param ruleName - Canonical rule name.
 * @param sourceContent - Rule implementation source text.
 * @param testContent - Rule test source text.
 * @returns Fixture coverage diagnostics.
 */
export function validateRuleFixtures(ruleName, sourceContent, testContent) {
  return [
    ...validateFixtureGroups(ruleName, testContent),
    ...validateFixtureNames(ruleName, testContent),
    ...validateFixableOutput(ruleName, sourceContent, testContent),
  ];
}

/**
 * Returns canonical names derived from direct rule implementation files.
 *
 * @returns Sorted rule names.
 */
export function collectRuleNames() {
  return readdirSync(RULES_DIR)
    .filter((name) => name.endsWith('.ts') && !name.endsWith(RULE_TEST_SUFFIX))
    .map((name) => name.slice(0, -'.ts'.length))
    .sort();
}

/**
 * Finds source rule names that violate repository layout policy.
 *
 * @param ruleNames - Canonical names derived from source filenames.
 * @returns Naming and missing-test diagnostics.
 */
export function validateSourceLayout(ruleNames) {
  return ruleNames.flatMap((ruleName) => {
    const failures = [];
    const rulePath = join(RULES_DIR, `${ruleName}.ts`);
    const testPath = join(RULES_DIR, `${ruleName}${RULE_TEST_SUFFIX}`);
    if (!RULE_NAME_PATTERN.test(ruleName)) {
      failures.push(`${ruleName}.ts: unsupported prefix or non-kebab-case rule name`);
    }
    if (!existsSync(testPath)) {
      failures.push(`${ruleName}.ts: missing "${ruleName}${RULE_TEST_SUFFIX}"`);
    } else {
      failures.push(
        ...validateRuleFixtures(
          ruleName,
          readFileSync(rulePath, 'utf8'),
          readFileSync(testPath, 'utf8'),
        ),
      );
    }
    return failures;
  });
}

/**
 * Finds differences between required and observed rule names.
 *
 * @param expected - Required rule names.
 * @param actual - Observed rule names.
 * @param context - Registry or preset label used in diagnostics.
 * @returns Missing and unexpected rule diagnostics.
 */
function compareNames(expected, actual, context) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return [
    ...expected
      .filter((name) => !actualSet.has(name))
      .map((name) => `${context}: missing rule "${name}"`),
    ...actual
      .filter((name) => !expectedSet.has(name))
      .map((name) => `${context}: unexpected rule "${name}"`),
  ];
}

/**
 * Validates source-to-registry parity.
 *
 * @param plugin - Built plugin API object.
 * @param sourceRuleNames - Canonical names derived from source filenames.
 * @returns Registry coverage diagnostics.
 */
export function validateBuiltRegistration(plugin, sourceRuleNames) {
  const registeredRules = Object.keys(plugin.rules ?? {});
  return compareNames(sourceRuleNames, registeredRules, 'plugin rules registry');
}

/**
 * Loads the built plugin used for source-to-registry validation.
 *
 * @returns Built plugin API object.
 * @throws {Error} When the plugin build output is missing.
 */
async function loadBuiltPlugin() {
  if (!existsSync(BUILT_PLUGIN_PATH)) {
    throw new Error('Plugin build is missing; run "pnpm build" before validating rules.');
  }
  const module = await import(`${pathToFileURL(BUILT_PLUGIN_PATH).href}?validation=${Date.now()}`);
  return module.default ?? module;
}

/** Runs repository-specific source-layout and registration validation. */
export async function run() {
  console.log('Validating repository rule conventions...');
  const ruleNames = collectRuleNames();
  const failures = [
    ...validateSourceLayout(ruleNames),
    ...validateBuiltRegistration(await loadBuiltPlugin(), ruleNames),
  ];
  if (failures.length > 0) {
    console.error(`\nRule convention validation failed (${failures.length} issue(s)):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`All ${ruleNames.length} rules satisfy repository conventions.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await run();
}
