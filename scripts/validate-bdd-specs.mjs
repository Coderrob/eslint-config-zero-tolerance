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
 * Validates BDD documents structurally with JSON Schema and enforces the few
 * relationships that JSON Schema cannot express across repository files.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..');
const PLUGIN_SRC = join(REPO_ROOT, 'packages', 'plugin', 'src');
const BDD_SCHEMA_PATH = join(REPO_ROOT, 'bdd-spec.schema.json');
const BDD_EXTENSION = '.bdd.json';
const TEST_SUFFIX = '.test.ts';
const TS_EXTENSION = '.ts';

/**
 * Recursively returns files whose names satisfy a predicate.
 *
 * @param directory - Directory to traverse.
 * @param predicate - Filename predicate selecting returned files.
 * @returns Absolute paths of matching files beneath the directory.
 */
export function walkDirectory(directory, predicate) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return walkDirectory(entryPath, predicate);
    return predicate(entry.name) ? [entryPath] : [];
  });
}

/**
 * Returns all BDD documents under the plugin source tree.
 *
 * @returns Absolute paths of discovered BDD documents.
 */
export function collectBddFiles() {
  return walkDirectory(PLUGIN_SRC, (name) => name.endsWith(BDD_EXTENSION));
}

/**
 * Returns all implementation TypeScript files that require BDD documents.
 *
 * @returns Absolute paths of non-test TypeScript source files.
 */
export function collectSourceFiles() {
  return walkDirectory(
    PLUGIN_SRC,
    (name) => name.endsWith(TS_EXTENSION) && !name.endsWith(TEST_SUFFIX),
  );
}

/**
 * Returns every identifier declared by a binding name.
 *
 * @param bindingName - TypeScript identifier or destructuring binding pattern.
 * @returns Identifier names declared by the binding.
 */
function getBindingNames(bindingName) {
  if (ts.isIdentifier(bindingName)) return [bindingName.text];
  return bindingName.elements.flatMap((element) =>
    ts.isBindingElement(element) ? getBindingNames(element.name) : [],
  );
}

/**
 * Returns whether a node has a particular modifier.
 *
 * @param node - TypeScript syntax node to inspect.
 * @param modifierKind - Modifier syntax kind to locate.
 * @returns Whether the node declares the requested modifier.
 */
function hasModifier(node, modifierKind) {
  return node.modifiers?.some((modifier) => modifier.kind === modifierKind) ?? false;
}

/**
 * Returns names declared by an export declaration.
 *
 * @param statement - TypeScript statement to inspect.
 * @returns Names exported by an export declaration, or an empty array.
 */
function getExportDeclarationNames(statement) {
  if (!ts.isExportDeclaration(statement)) return [];
  const exportClause = statement.exportClause;
  if (exportClause === undefined) return [];
  if (!ts.isNamedExports(exportClause)) return [exportClause.name.text];
  return exportClause.elements.map((element) => element.name.text);
}

/**
 * Returns the identifier declared by a named statement.
 *
 * @param statement - TypeScript statement that may declare a name.
 * @returns The declared identifier name, or an empty array.
 */
function getDeclarationName(statement) {
  if (!('name' in statement)) return [];
  if (statement.name === undefined) return [];
  if (!ts.isIdentifier(statement.name)) return [];
  return [statement.name.text];
}

/**
 * Returns names declared directly by an exported statement.
 *
 * @param statement - TypeScript statement to inspect.
 * @returns Names declared by a non-default exported statement.
 */
function getDirectExportNames(statement) {
  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return [];
  if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) return [];
  if (!ts.isVariableStatement(statement)) return getDeclarationName(statement);
  return statement.declarationList.declarations.flatMap((declaration) =>
    getBindingNames(declaration.name),
  );
}

/**
 * Extracts named exports from TypeScript syntax without depending on formatting.
 *
 * @param sourceText - TypeScript source text to parse.
 * @param fileName - Filename used for parser context and diagnostics.
 * @returns Set of names exported by the source text.
 */
export function extractNamedExports(sourceText, fileName = 'source.ts') {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const exports = new Set();

  for (const statement of sourceFile.statements) {
    const statementExports = [
      ...getExportDeclarationNames(statement),
      ...getDirectExportNames(statement),
    ];
    for (const name of statementExports) exports.add(name);
  }
  return exports;
}

/**
 * Creates the draft-2020-12 validator used for every BDD document.
 *
 * @param schema - JSON Schema document to compile.
 * @returns Compiled Ajv validation function.
 */
export function createSchemaValidator(schema) {
  return new Ajv2020({ allErrors: true, strict: true }).compile(schema);
}

/**
 * Formats an Ajv error as a compact repository-facing diagnostic.
 *
 * @param error - Ajv validation error to format.
 * @returns Path-qualified validation message.
 */
function formatSchemaError(error) {
  const location = error.instancePath || '/';
  return `${location} ${error.message ?? 'is invalid'}`;
}

/**
 * Parses a JSON file, returning either its document or one parse diagnostic.
 *
 * @param specPath - BDD document path to read.
 * @returns Parsed specification and an empty error list, or one parse error.
 */
function readSpec(specPath) {
  try {
    return { spec: JSON.parse(readFileSync(specPath, 'utf8')), errors: [] };
  } catch (error) {
    return { spec: undefined, errors: [`Failed to parse JSON: ${error.message}`] };
  }
}

/**
 * Runs schema validation on every BDD document.
 *
 * @param bddFiles - BDD document paths to validate.
 * @param validate - Compiled Ajv validation function.
 * @returns File-qualified schema validation failures.
 */
export function checkSchemaCompliance(bddFiles, validate) {
  return bddFiles.flatMap((file) => {
    const parsed = readSpec(file);
    if (parsed.errors.length > 0) return [{ file, errors: parsed.errors }];
    if (validate(parsed.spec)) return [];
    return [{ file, errors: (validate.errors ?? []).map(formatSchemaError) }];
  });
}

/**
 * Finds BDD documents without the sibling source file implied by their name.
 *
 * @param bddFiles - BDD document paths to inspect.
 * @param sourceFileSet - Known implementation source paths.
 * @returns BDD documents whose source sibling is absent.
 */
export function checkOrphanedSpecs(bddFiles, sourceFileSet) {
  return bddFiles.filter((bddPath) => !sourceFileSet.has(bddPath.slice(0, -BDD_EXTENSION.length)));
}

/**
 * Finds implementation files without sibling BDD documents.
 *
 * @param sourceFiles - Implementation source paths to inspect.
 * @param bddFileSet - Known BDD document paths.
 * @returns Source files whose BDD sibling is absent.
 */
export function checkMissingSpecs(sourceFiles, bddFileSet) {
  return sourceFiles.filter((sourcePath) => !bddFileSet.has(sourcePath + BDD_EXTENSION));
}

/**
 * Verifies that sourceFile identifies the source sibling using a workspace path.
 *
 * @param bddFiles - BDD document paths to inspect.
 * @returns Incorrect source-file reference diagnostics.
 */
export function checkSourceFileReferences(bddFiles) {
  return bddFiles.flatMap((file) => {
    const { spec } = readSpec(file);
    if (!spec || typeof spec.sourceFile !== 'string') return [];
    const sourcePath = file.slice(0, -BDD_EXTENSION.length);
    const expected = relative(REPO_ROOT, sourcePath).replaceAll('\\', '/');
    return spec.sourceFile === expected ? [] : [{ file, expected, actual: spec.sourceFile }];
  });
}

/**
 * Verifies exact parity between documented and actual named TypeScript exports.
 *
 * @param spec - Parsed BDD specification.
 * @returns Documented export-name set, or undefined for an invalid shape.
 */
function getDocumentedExports(spec) {
  if (spec === undefined) return undefined;
  if (spec.module === undefined) return undefined;
  if (!Array.isArray(spec.module.exports)) return undefined;
  return new Set(spec.module.exports);
}

/**
 * Returns export-parity failures for one BDD document.
 *
 * @param file - BDD document path to compare with its source sibling.
 * @returns Export-parity failure for the document, or an empty array.
 */
function checkFileExportParity(file) {
  const sourcePath = file.slice(0, -BDD_EXTENSION.length);
  if (!existsSync(sourcePath)) return [];
  const documented = getDocumentedExports(readSpec(file).spec);
  if (documented === undefined) return [];
  const actual = extractNamedExports(readFileSync(sourcePath, 'utf8'), sourcePath);
  const missingInSource = [...documented].filter((name) => !actual.has(name));
  const missingInSpec = [...actual].filter((name) => !documented.has(name));
  if (missingInSource.length + missingInSpec.length === 0) return [];
  return [{ file, missingInSource, missingInSpec }];
}

/**
 * Verifies exact parity between documented and actual named TypeScript exports.
 *
 * @param bddFiles - BDD document paths to compare.
 * @returns Named-export parity failures across all documents.
 */
export function checkExportParity(bddFiles) {
  return bddFiles.flatMap(checkFileExportParity);
}

const NO_COLOR = process.env['NO_COLOR'] !== undefined;
/**
 * Applies an ANSI color code unless color output is disabled.
 *
 * @param code - ANSI color code.
 * @param text - Text to decorate.
 * @returns Decorated text, or the original text when `NO_COLOR` is set.
 */
const color = (code, text) => (NO_COLOR ? text : `\x1b[${code}m${text}\x1b[0m`);

/**
 * Returns a normalized repository-relative display path.
 *
 * @param file - Absolute filesystem path.
 * @returns Forward-slash path relative to the repository root.
 */
const displayPath = (file) => relative(REPO_ROOT, file).replaceAll('\\', '/');

/**
 * Prints one grouped collection and returns whether it contained failures.
 *
 * @param heading - Diagnostic group heading.
 * @param failures - Failures belonging to the group.
 * @param describe - Callback that prints one failure.
 * @returns Whether the group contained at least one failure.
 */
function printGroup(heading, failures, describe) {
  if (failures.length === 0) return false;
  console.error(color(31, `\n${heading} (${failures.length}):`));
  for (const failure of failures) describe(failure);
  return true;
}

/**
 * Prints one schema-validation failure.
 *
 * @param failure - File path and schema-error collection to print.
 */
function printSchemaFailure(failure) {
  const { file, errors } = failure;
  console.error(`  ${displayPath(file)}`);
  for (const error of errors) console.error(`    - ${error}`);
}

/**
 * Prints one file path as a list item.
 *
 * @param file - Absolute path to print.
 */
function printFileFailure(file) {
  console.error(`  - ${displayPath(file)}`);
}

/**
 * Prints one named-export parity failure.
 *
 * @param failure - Export-parity diagnostic to print.
 */
function printExportFailure(failure) {
  console.error(`  ${displayPath(failure.file)}`);
  for (const name of failure.missingInSource) console.error(`    - source lacks "${name}"`);
  for (const name of failure.missingInSpec) console.error(`    - spec lacks "${name}"`);
}

/**
 * Prints grouped validation failures and returns whether any exist.
 *
 * @param results - Aggregated BDD validation results.
 * @returns Whether any validation group contains failures.
 */
function report(results) {
  const groupResults = [
    printGroup('Schema violations', results.schemaFailures, printSchemaFailure),
    printGroup('BDD files without source siblings', results.orphans, printFileFailure),
    printGroup('Source files without BDD siblings', results.missing, printFileFailure),
    printGroup('Incorrect sourceFile references', results.sourceReferences, (failure) =>
      console.error(`  ${displayPath(failure.file)}: expected "${failure.expected}"`),
    ),
    printGroup('Named export mismatches', results.exportFailures, printExportFailure),
  ];
  const failed = groupResults.includes(true);

  if (!failed) {
    console.log(
      color(
        32,
        `All ${results.totalBdd} BDD documents are valid (${results.totalSource} sources checked).`,
      ),
    );
  }
  return failed;
}

/** Runs all structural and repository-relational BDD checks. */
export function run() {
  console.log('Validating BDD specification files...');
  const schema = JSON.parse(readFileSync(BDD_SCHEMA_PATH, 'utf8'));
  const validate = createSchemaValidator(schema);
  const bddFiles = collectBddFiles();
  const sourceFiles = collectSourceFiles();
  const results = {
    totalBdd: bddFiles.length,
    totalSource: sourceFiles.length,
    schemaFailures: checkSchemaCompliance(bddFiles, validate),
    orphans: checkOrphanedSpecs(bddFiles, new Set(sourceFiles)),
    missing: checkMissingSpecs(sourceFiles, new Set(bddFiles)),
    sourceReferences: checkSourceFileReferences(bddFiles),
    exportFailures: checkExportParity(bddFiles),
  };
  process.exitCode = report(results) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) run();
