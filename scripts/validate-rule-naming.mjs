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
 * Enforces repository-specific rule naming, layout, and preset registration.
 * Generic ESLint rule-authoring requirements are delegated to
 * eslint-plugin-eslint-plugin through eslint.config.mjs.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..');
const RULES_DIR = join(REPO_ROOT, 'packages', 'plugin', 'src', 'rules');
const DOCS_RULES_DIR = join(REPO_ROOT, 'docs', 'rules');
const BUILT_PLUGIN_PATH = join(REPO_ROOT, 'packages', 'plugin', 'dist', 'index.mjs');
const RULE_TEST_SUFFIX = '.test.ts';
const RULE_BDD_SUFFIX = '.ts.bdd.json';
const RULE_NAME_PATTERN = /^(?:max|no|prefer|require|sort)-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** Returns direct rule implementation files, excluding tests and support code. */
export function collectRuleSourceFiles() {
  return readdirSync(RULES_DIR)
    .filter((name) => name.endsWith('.ts') && !name.endsWith(RULE_TEST_SUFFIX))
    .map((name) => join(RULES_DIR, name))
    .sort();
}

/** Converts a kebab-case rule identifier to its required camelCase export. */
export function toCamelCase(ruleName) {
  return ruleName.replace(/-([a-z0-9])/gu, (_, character) => character.toUpperCase());
}

/** Returns whether a syntax node has a particular modifier. */
function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

/** Returns a statically declared string property from an object literal. */
function propertyHasName(property, propertyName) {
  if (!ts.isPropertyAssignment(property)) return false;
  if (ts.isIdentifier(property.name)) return property.name.text === propertyName;
  if (ts.isStringLiteral(property.name)) return property.name.text === propertyName;
  return false;
}

/** Returns a statically declared string property from an object literal. */
function getStringProperty(objectLiteral, propertyName) {
  const property = objectLiteral.properties.find((candidate) =>
    propertyHasName(candidate, propertyName),
  );
  if (!property || !ts.isPropertyAssignment(property)) return undefined;
  return ts.isStringLiteralLike(property.initializer) ? property.initializer.text : undefined;
}

/** Returns a call expression initialized by an identifier, when present. */
function getIdentifierCall(declaration) {
  if (declaration.initializer === undefined) return undefined;
  if (!ts.isCallExpression(declaration.initializer)) return undefined;
  if (!ts.isIdentifier(declaration.initializer.expression)) return undefined;
  return declaration.initializer;
}

/** Returns the configured rule name from a createRule call. */
function getConfiguredRuleName(callExpression) {
  const [options] = callExpression.arguments;
  if (options === undefined) return undefined;
  if (!ts.isObjectLiteralExpression(options)) return undefined;
  return getStringProperty(options, 'name');
}

/** Inspects one variable declaration for an exported createRule call. */
function inspectCreateRuleDeclaration(declaration) {
  if (!ts.isIdentifier(declaration.name)) return undefined;
  const callExpression = getIdentifierCall(declaration);
  if (callExpression === undefined) return undefined;
  if (callExpression.expression.text !== 'createRule') return undefined;
  return {
    configuredName: getConfiguredRuleName(callExpression),
    namedExport: declaration.name.text,
  };
}

/** Returns whether a value is defined. */
function isDefined(value) {
  return value !== undefined;
}

/** Inspects an exported variable statement for a createRule declaration. */
function inspectCreateRuleStatement(statement) {
  if (!ts.isVariableStatement(statement)) return undefined;
  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return undefined;
  return statement.declarationList.declarations.map(inspectCreateRuleDeclaration).find(isDefined);
}

/** Returns the identifier from a default export assignment. */
function inspectDefaultExport(statement) {
  if (!ts.isExportAssignment(statement)) return undefined;
  if (statement.isExportEquals) return undefined;
  if (!ts.isIdentifier(statement.expression)) return undefined;
  return statement.expression.text;
}

/** Reads the naming-relevant declarations from a rule using TypeScript syntax. */
export function inspectRuleSource(rulePath) {
  const sourceFile = ts.createSourceFile(
    rulePath,
    readFileSync(rulePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let namedExport;
  let configuredName;
  let defaultExport;

  for (const statement of sourceFile.statements) {
    const createRule = inspectCreateRuleStatement(statement);
    if (createRule !== undefined) ({ configuredName, namedExport } = createRule);
    const exportedIdentifier = inspectDefaultExport(statement);
    if (exportedIdentifier !== undefined) defaultExport = exportedIdentifier;
  }
  return { namedExport, configuredName, defaultExport };
}

/** Returns naming failures for one rule inspection. */
function collectNamingFailures(filename, ruleName, expectedExport, inspection) {
  const checks = [
    [
      RULE_NAME_PATTERN.test(ruleName),
      `${filename}: unsupported prefix or non-kebab-case rule name`,
    ],
    [
      inspection.namedExport === expectedExport,
      `${filename}: named createRule export must be "${expectedExport}"`,
    ],
    [inspection.configuredName === ruleName, `${filename}: createRule name must be "${ruleName}"`],
    [
      inspection.defaultExport === expectedExport,
      `${filename}: default export must be "${expectedExport}"`,
    ],
  ];
  return checks.flatMap(([valid, message]) => (valid ? [] : [message]));
}

/** Returns required sibling-file failures for one rule. */
function collectSiblingFailures(filename, ruleName) {
  const requiredSiblings = [
    [join(RULES_DIR, `${ruleName}${RULE_TEST_SUFFIX}`), `${ruleName}${RULE_TEST_SUFFIX}`],
    [join(RULES_DIR, `${ruleName}${RULE_BDD_SUFFIX}`), `${ruleName}${RULE_BDD_SUFFIX}`],
    [join(DOCS_RULES_DIR, `${ruleName}.md`), `docs/rules/${ruleName}.md`],
  ];
  return requiredSiblings
    .filter(([path]) => !existsSync(path))
    .map(([, displayName]) => `${filename}: missing "${displayName}"`);
}

/** Validates repository-local naming and sibling-file requirements for a rule. */
export function validateRuleLayout(rulePath) {
  const filename = basename(rulePath);
  const ruleName = filename.slice(0, -'.ts'.length);
  const expectedExport = toCamelCase(ruleName);
  const inspection = inspectRuleSource(rulePath);
  const failures = [
    ...collectNamingFailures(filename, ruleName, expectedExport, inspection),
    ...collectSiblingFailures(filename, ruleName),
  ];
  return { ruleName, failures };
}

/** Removes a plugin namespace from a configured rule key. */
function unprefixRuleName(ruleName) {
  return ruleName.slice(ruleName.lastIndexOf('/') + 1);
}

/** Finds names absent from an actual rule-name set. */
function findMissingNames(expected, actual, context, qualifier) {
  const failures = [];
  for (const name of expected) {
    if (!actual.has(name)) failures.push(`${context}: ${qualifier} rule "${name}"`);
  }
  return failures;
}

/** Finds differences between an expected and actual rule-name collection. */
function compareNames(expected, actual, context) {
  return [
    ...findMissingNames(expected, new Set(actual), context, 'missing'),
    ...findMissingNames(actual, new Set(expected), context, 'unexpected'),
  ];
}

/** Returns registered rule names from the built plugin. */
function getRegisteredRuleNames(plugin) {
  if (plugin.rules === undefined) return [];
  return Object.keys(plugin.rules);
}

/** Returns normalized rule names from one built preset. */
function getPresetRuleNames(plugin, presetName) {
  if (plugin.configs === undefined) return [];
  const preset = plugin.configs[presetName];
  if (preset === undefined) return [];
  if (preset.rules === undefined) return [];
  return Object.keys(preset.rules).map(unprefixRuleName);
}

/** Validates registry and preset coverage by inspecting the built package API. */
export function validateBuiltRegistration(plugin, sourceRuleNames) {
  const failures = [];
  const registeredRules = getRegisteredRuleNames(plugin);
  failures.push(...compareNames(sourceRuleNames, registeredRules, 'plugin rules registry'));

  for (const presetName of ['recommended', 'strict', 'legacy-recommended', 'legacy-strict']) {
    const configuredRules = getPresetRuleNames(plugin, presetName);
    failures.push(...compareNames(registeredRules, configuredRules, `${presetName} preset`));
  }
  return failures;
}

/** Loads the already-built plugin used by repository lint and validation. */
async function loadBuiltPlugin() {
  if (!existsSync(BUILT_PLUGIN_PATH)) {
    throw new Error('Plugin build is missing; run "pnpm build" before validating rules.');
  }
  const module = await import(`${pathToFileURL(BUILT_PLUGIN_PATH).href}?validation=${Date.now()}`);
  return module.default ?? module;
}

/** Runs repository-specific rule validation. */
export async function run() {
  console.log('Validating repository rule conventions...');
  const sourceFiles = collectRuleSourceFiles();
  const layouts = sourceFiles.map(validateRuleLayout);
  const plugin = await loadBuiltPlugin();
  const failures = [
    ...layouts.flatMap((layout) => layout.failures),
    ...validateBuiltRegistration(
      plugin,
      layouts.map((layout) => layout.ruleName),
    ),
  ];

  if (failures.length > 0) {
    console.error(`\nRule convention validation failed (${failures.length} issue(s)):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`All ${sourceFiles.length} rules satisfy repository conventions.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await run();
}
