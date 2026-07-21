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

/**
 * Returns direct rule implementation files, excluding tests and support code.
 *
 * @returns Sorted absolute paths of rule implementation files.
 */
export function collectRuleSourceFiles() {
  return readdirSync(RULES_DIR)
    .filter((name) => name.endsWith('.ts') && !name.endsWith(RULE_TEST_SUFFIX))
    .map((name) => join(RULES_DIR, name))
    .sort();
}

/**
 * Converts a kebab-case rule identifier to its required camelCase export.
 *
 * @param ruleName - Canonical kebab-case rule name.
 * @returns Required camelCase export name.
 */
export function toCamelCase(ruleName) {
  return ruleName.replace(/-([a-z0-9])/gu, (_, character) => character.toUpperCase());
}

/**
 * Returns whether a syntax node has a particular modifier.
 *
 * @param node - TypeScript syntax node to inspect.
 * @param kind - Modifier syntax kind to locate.
 * @returns Whether the node declares the requested modifier.
 */
function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

/**
 * Returns a statically declared string property from an object literal.
 *
 * @param property - Object-literal property to inspect.
 * @param propertyName - Identifier or string-literal property name to match.
 * @returns Whether the property is an assignment with the requested name.
 */
function propertyHasName(property, propertyName) {
  if (!ts.isPropertyAssignment(property)) return false;
  if (ts.isIdentifier(property.name)) return property.name.text === propertyName;
  if (ts.isStringLiteral(property.name)) return property.name.text === propertyName;
  return false;
}

/**
 * Returns a statically declared string property from an object literal.
 *
 * @param objectLiteral - TypeScript object literal to inspect.
 * @param propertyName - Property name whose value should be read.
 * @returns Static string value, or undefined when it cannot be resolved.
 */
function getStringProperty(objectLiteral, propertyName) {
  const property = objectLiteral.properties.find((candidate) =>
    propertyHasName(candidate, propertyName),
  );
  if (property === undefined) return undefined;
  return ts.isStringLiteralLike(property.initializer) ? property.initializer.text : undefined;
}

/**
 * Returns a call expression initialized by an identifier, when present.
 *
 * @param declaration - Variable declaration to inspect.
 * @returns Identifier-based call expression, or undefined for another initializer shape.
 */
function getIdentifierCall(declaration) {
  if (declaration.initializer === undefined) return undefined;
  if (!ts.isCallExpression(declaration.initializer)) return undefined;
  if (!ts.isIdentifier(declaration.initializer.expression)) return undefined;
  return declaration.initializer;
}

/**
 * Returns the configured rule name from a createRule call.
 *
 * @param callExpression - `createRule` call expression to inspect.
 * @returns Static `name` option, or undefined when it cannot be resolved.
 */
function getConfiguredRuleName(callExpression) {
  const [options] = callExpression.arguments;
  if (options === undefined) return undefined;
  if (!ts.isObjectLiteralExpression(options)) return undefined;
  return getStringProperty(options, 'name');
}

/**
 * Inspects one variable declaration for an exported createRule call.
 *
 * @param declaration - Exported variable declaration candidate.
 * @returns Rule export inspection, or undefined when the declaration is not `createRule`.
 */
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

/**
 * Inspects an exported variable statement for a createRule declaration.
 *
 * @param statement - TypeScript statement to inspect.
 * @returns First exported `createRule` inspection, or undefined when absent.
 */
function inspectCreateRuleStatement(statement) {
  if (!ts.isVariableStatement(statement)) return undefined;
  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return undefined;
  return statement.declarationList.declarations
    .map(inspectCreateRuleDeclaration)
    .find((inspection) => inspection !== undefined);
}

/**
 * Returns the identifier from a default export assignment.
 *
 * @param statement - TypeScript statement to inspect.
 * @returns Default-exported identifier, or undefined for another statement shape.
 */
function inspectDefaultExport(statement) {
  if (!ts.isExportAssignment(statement)) return undefined;
  if (statement.isExportEquals) return undefined;
  if (!ts.isIdentifier(statement.expression)) return undefined;
  return statement.expression.text;
}

/**
 * Reads the naming-relevant declarations from a rule using TypeScript syntax.
 *
 * @param rulePath - Absolute path to a rule implementation.
 * @returns Named export, configured rule name, and default export discovered in the source.
 */
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

/**
 * Returns naming failures for one rule inspection.
 *
 * @param filename - Rule source filename used in diagnostics.
 * @param ruleName - Canonical rule name derived from the filename.
 * @param expectedExport - Required camelCase export name.
 * @param inspection - Naming values extracted from the rule source.
 * @returns Naming diagnostics for mismatched values.
 */
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

/**
 * Returns required sibling-file failures for one rule.
 *
 * @param filename - Rule source filename used in diagnostics.
 * @param ruleName - Canonical rule name used to derive sibling paths.
 * @returns Diagnostics for missing tests, BDD metadata, or documentation.
 */
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

/**
 * Validates repository-local naming and sibling-file requirements for a rule.
 *
 * @param rulePath - Absolute path to a rule implementation.
 * @returns Canonical rule name and all layout diagnostics.
 */
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

/**
 * Removes a plugin namespace from a configured rule key.
 *
 * @param ruleName - Qualified or unqualified configured rule key.
 * @returns Rule name without its plugin namespace.
 */
function unprefixRuleName(ruleName) {
  return ruleName.slice(ruleName.lastIndexOf('/') + 1);
}

/**
 * Finds names absent from an actual rule-name set.
 *
 * @param expected - Names that must exist.
 * @param actual - Set against which required names are checked.
 * @param context - Registry or preset label used in diagnostics.
 * @param qualifier - Diagnostic qualifier such as `missing` or `unexpected`.
 * @returns Diagnostics for names absent from the actual set.
 */
function findMissingNames(expected, actual, context, qualifier) {
  const failures = [];
  for (const name of expected) {
    if (!actual.has(name)) failures.push(`${context}: ${qualifier} rule "${name}"`);
  }
  return failures;
}

/**
 * Finds differences between an expected and actual rule-name collection.
 *
 * @param expected - Required rule-name collection.
 * @param actual - Observed rule-name collection.
 * @param context - Registry or preset label used in diagnostics.
 * @returns Missing and unexpected rule-name diagnostics.
 */
function compareNames(expected, actual, context) {
  return [
    ...findMissingNames(expected, new Set(actual), context, 'missing'),
    ...findMissingNames(actual, new Set(expected), context, 'unexpected'),
  ];
}

/**
 * Returns normalized rule names from one built preset.
 *
 * @param plugin - Built plugin API object.
 * @param presetName - Preset key to inspect.
 * @returns Configured rule names without plugin namespaces.
 */
function getPresetRuleNames(plugin, presetName) {
  if (plugin.configs === undefined) return [];
  const preset = plugin.configs[presetName];
  if (preset === undefined) return [];
  if (preset.rules === undefined) return [];
  return Object.keys(preset.rules).map(unprefixRuleName);
}

/**
 * Validates registry and preset coverage by inspecting the built package API.
 *
 * @param plugin - Built plugin API object.
 * @param sourceRuleNames - Canonical names derived from rule source files.
 * @returns Registry and preset coverage diagnostics.
 */
export function validateBuiltRegistration(plugin, sourceRuleNames) {
  const failures = [];
  const registeredRules = Object.keys(plugin.rules ?? {});
  failures.push(...compareNames(sourceRuleNames, registeredRules, 'plugin rules registry'));

  for (const presetName of ['recommended', 'strict', 'legacy-recommended', 'legacy-strict']) {
    const configuredRules = getPresetRuleNames(plugin, presetName);
    failures.push(...compareNames(registeredRules, configuredRules, `${presetName} preset`));
  }
  return failures;
}

/**
 * Loads the already-built plugin used by repository lint and validation.
 *
 * @returns Built plugin API object with a cache-busting module URL.
 * @throws {Error} When the plugin build output is missing.
 */
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
