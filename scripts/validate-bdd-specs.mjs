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

/** Recursively returns files whose names satisfy a predicate. */
export function walkDirectory(directory, predicate) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return walkDirectory(entryPath, predicate);
    return predicate(entry.name) ? [entryPath] : [];
  });
}

/** Returns all BDD documents under the plugin source tree. */
export function collectBddFiles() {
  return walkDirectory(PLUGIN_SRC, (name) => name.endsWith(BDD_EXTENSION));
}

/** Returns all implementation TypeScript files that require BDD documents. */
export function collectSourceFiles() {
  return walkDirectory(
    PLUGIN_SRC,
    (name) => name.endsWith(TS_EXTENSION) && !name.endsWith(TEST_SUFFIX),
  );
}

/** Adds every identifier declared by a binding name to the target set. */
function addBindingNames(bindingName, names) {
  if (ts.isIdentifier(bindingName)) {
    names.add(bindingName.text);
    return;
  }
  for (const element of bindingName.elements) {
    if (ts.isBindingElement(element)) addBindingNames(element.name, names);
  }
}

/** Returns whether a node has a particular modifier. */
function hasModifier(node, modifierKind) {
  return node.modifiers?.some((modifier) => modifier.kind === modifierKind) ?? false;
}

/** Adds names declared by an export clause to the target set. */
function addExportClauseNames(exportClause, names) {
  if (!ts.isNamedExports(exportClause)) {
    names.add(exportClause.name.text);
    return;
  }
  for (const element of exportClause.elements) names.add(element.name.text);
}

/** Adds names declared by an export declaration to the target set. */
function addExportDeclarationNames(statement, names) {
  if (!ts.isExportDeclaration(statement)) return;
  if (statement.exportClause === undefined) return;
  addExportClauseNames(statement.exportClause, names);
}

/** Returns whether a statement is a named exported declaration. */
function isNamedExport(statement) {
  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return false;
  return !hasModifier(statement, ts.SyntaxKind.DefaultKeyword);
}

/** Adds binding names from an exported variable statement. */
function addVariableStatementNames(statement, names) {
  if (!ts.isVariableStatement(statement)) return false;
  for (const declaration of statement.declarationList.declarations) {
    addBindingNames(declaration.name, names);
  }
  return true;
}

/** Adds the identifier declared by an exported declaration. */
function addDeclarationName(statement, names) {
  if (!('name' in statement)) return;
  if (statement.name === undefined) return;
  if (!ts.isIdentifier(statement.name)) return;
  names.add(statement.name.text);
}

/** Adds names declared directly by a named exported statement. */
function addNamedStatementExports(statement, names) {
  if (!isNamedExport(statement)) return;
  if (addVariableStatementNames(statement, names)) return;
  addDeclarationName(statement, names);
}

/** Extracts named exports from TypeScript syntax without depending on formatting. */
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
    addExportDeclarationNames(statement, exports);
    addNamedStatementExports(statement, exports);
  }
  return exports;
}

/** Creates the draft-2020-12 validator used for every BDD document. */
export function createSchemaValidator(schema) {
  return new Ajv2020({ allErrors: true, strict: true }).compile(schema);
}

/** Formats an Ajv error as a compact repository-facing diagnostic. */
function formatSchemaError(error) {
  const location = error.instancePath || '/';
  return `${location} ${error.message ?? 'is invalid'}`;
}

/** Parses a JSON file, returning either its document or one parse diagnostic. */
function readSpec(specPath) {
  try {
    return { spec: JSON.parse(readFileSync(specPath, 'utf8')), errors: [] };
  } catch (error) {
    return { spec: undefined, errors: [`Failed to parse JSON: ${error.message}`] };
  }
}

/** Runs schema validation on every BDD document. */
export function checkSchemaCompliance(bddFiles, validate) {
  return bddFiles.flatMap((file) => {
    const parsed = readSpec(file);
    if (parsed.errors.length > 0) return [{ file, errors: parsed.errors }];
    if (validate(parsed.spec)) return [];
    return [{ file, errors: (validate.errors ?? []).map(formatSchemaError) }];
  });
}

/** Finds BDD documents without the sibling source file implied by their name. */
export function checkOrphanedSpecs(bddFiles, sourceFileSet) {
  return bddFiles.filter((bddPath) => !sourceFileSet.has(bddPath.slice(0, -BDD_EXTENSION.length)));
}

/** Finds implementation files without sibling BDD documents. */
export function checkMissingSpecs(sourceFiles, bddFileSet) {
  return sourceFiles.filter((sourcePath) => !bddFileSet.has(sourcePath + BDD_EXTENSION));
}

/** Verifies that sourceFile identifies the source sibling using a workspace path. */
export function checkSourceFileReferences(bddFiles) {
  return bddFiles.flatMap((file) => {
    const { spec } = readSpec(file);
    if (!spec || typeof spec.sourceFile !== 'string') return [];
    const sourcePath = file.slice(0, -BDD_EXTENSION.length);
    const expected = relative(REPO_ROOT, sourcePath).replaceAll('\\', '/');
    return spec.sourceFile === expected ? [] : [{ file, expected, actual: spec.sourceFile }];
  });
}

/** Verifies exact parity between documented and actual named TypeScript exports. */
function getDocumentedExports(spec) {
  if (spec === undefined) return undefined;
  if (spec.module === undefined) return undefined;
  if (!Array.isArray(spec.module.exports)) return undefined;
  return new Set(spec.module.exports);
}

/** Returns export-parity failures for one BDD document. */
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

/** Verifies exact parity between documented and actual named TypeScript exports. */
export function checkExportParity(bddFiles) {
  return bddFiles.flatMap(checkFileExportParity);
}

const NO_COLOR = process.env['NO_COLOR'] !== undefined;
const color = (code, text) => (NO_COLOR ? text : `\x1b[${code}m${text}\x1b[0m`);
const displayPath = (file) => relative(REPO_ROOT, file).replaceAll('\\', '/');

/** Prints one grouped collection and returns whether it contained failures. */
function printGroup(heading, failures, describe) {
  if (failures.length === 0) return false;
  console.error(color(31, `\n${heading} (${failures.length}):`));
  for (const failure of failures) describe(failure);
  return true;
}

/** Prints one schema-validation failure. */
function printSchemaFailure({ file, errors }) {
  console.error(`  ${displayPath(file)}`);
  for (const error of errors) console.error(`    - ${error}`);
}

/** Prints one file path as a list item. */
function printFileFailure(file) {
  console.error(`  - ${displayPath(file)}`);
}

/** Prints one incorrect source-file reference. */
function printSourceReference(failure) {
  console.error(`  ${displayPath(failure.file)}: expected "${failure.expected}"`);
}

/** Prints one named-export parity failure. */
function printExportFailure(failure) {
  console.error(`  ${displayPath(failure.file)}`);
  for (const name of failure.missingInSource) console.error(`    - source lacks "${name}"`);
  for (const name of failure.missingInSpec) console.error(`    - spec lacks "${name}"`);
}

/** Prints grouped validation failures and returns whether any exist. */
function report(results) {
  const groupResults = [
    printGroup('Schema violations', results.schemaFailures, printSchemaFailure),
    printGroup('BDD files without source siblings', results.orphans, printFileFailure),
    printGroup('Source files without BDD siblings', results.missing, printFileFailure),
    printGroup('Incorrect sourceFile references', results.sourceReferences, printSourceReference),
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
