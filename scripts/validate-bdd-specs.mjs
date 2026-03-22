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
 * Validates all BDD specification files (.ts.bdd.json) under packages/plugin/src/.
 *
 * Checks performed:
 *   1. Schema compliance — required fields, value types, and constraint validation.
 *   2. No abandoned specs — every .ts.bdd.json must reference an existing source file.
 *   3. No missing specs — every non-test .ts source file must have a sibling .ts.bdd.json.
 *   4. Export coverage — every name in module.exports must exist as a named export in the source.
 *
 * Exits with code 0 on success, 1 on any validation failure.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const PLUGIN_SRC = join(REPO_ROOT, 'packages', 'plugin', 'src');
const BDD_SCHEMA_PATH = join(REPO_ROOT, 'bdd-spec.schema.json');
const BDD_EXTENSION = '.bdd.json';
const TEST_SUFFIX = '.test.ts';
const TS_EXTENSION = '.ts';
const BDD_SCHEMA = JSON.parse(readFileSync(BDD_SCHEMA_PATH, 'utf8'));

// ─── File discovery ───────────────────────────────────────────────────────────

/**
 * Recursively walks a directory and returns files matching the predicate.
 *
 * @param {string} dir - Absolute directory path to walk.
 * @param {(name: string) => boolean} predicate - Returns true for files to include.
 * @returns {string[]} Absolute paths of matching files.
 */
function walkDirectory(dir, predicate) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath, predicate));
    } else if (predicate(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Collects all .ts.bdd.json files under the plugin source directory.
 *
 * @returns {string[]} Absolute paths of all BDD spec files.
 */
function collectBddFiles() {
  return walkDirectory(PLUGIN_SRC, (name) => name.endsWith(BDD_EXTENSION));
}

/**
 * Collects all non-test TypeScript source files under the plugin source directory.
 *
 * @returns {string[]} Absolute paths of all non-test .ts source files.
 */
function collectSourceFiles() {
  return walkDirectory(
    PLUGIN_SRC,
    (name) =>
      name.endsWith(TS_EXTENSION) && !name.endsWith(TEST_SUFFIX) && !name.endsWith(BDD_EXTENSION),
  );
}

// ─── Named export extraction ──────────────────────────────────────────────────

/**
 * Extracts all named (non-default) exports from TypeScript source content using
 * regex heuristics. Handles direct declarations and named export list statements.
 *
 * @param {string} content - Source file text.
 * @returns {Set<string>} Set of exported identifiers.
 */
function extractNamedExports(content) {
  const exports = new Set();

  // export const/let/var/function/function*/class/enum/abstract class/type/interface <name>
  const declarationPattern =
    /^export\s+(?:const|let|var|function\*?|class|enum|abstract\s+class|type|interface)\s+(\w+)/gm;
  let match;
  while ((match = declarationPattern.exec(content)) !== null) {
    exports.add(match[1]);
  }

  // export { foo, bar as baz } and export { foo, bar as baz } from './module'
  const listPattern = /^export\s*\{([^}]+)\}(?:\s*from\s*['"][^'"]+['"])?/gm;
  while ((match = listPattern.exec(content)) !== null) {
    for (const segment of match[1].split(',')) {
      const trimmed = segment.trim();
      if (!trimmed) continue;
      // 'local as exported' → take the exported (alias) name
      const parts = trimmed.split(/\s+as\s+/);
      const exportedName = (parts.at(-1) ?? '').trim();
      if (/^\w+$/.test(exportedName)) {
        exports.add(exportedName);
      }
    }
  }

  return exports;
}

/**
 * Validates top-level fields using the shared JSON schema definition.
 *
 * @param {unknown} spec - Parsed JSON content of a .ts.bdd.json file.
 * @returns {string[]} Top-level schema validation errors.
 */
function validateTopLevelAgainstSchema(spec) {
  const errors = [];

  if (typeof spec !== 'object' || spec === null) {
    return ['Root value must be a JSON object'];
  }

  const requiredFields = Array.isArray(BDD_SCHEMA['required']) ? BDD_SCHEMA['required'] : [];
  const properties =
    typeof BDD_SCHEMA['properties'] === 'object' && BDD_SCHEMA['properties'] !== null
      ? BDD_SCHEMA['properties']
      : {};

  for (const field of requiredFields) {
    if (!Object.hasOwn(spec, field)) {
      errors.push(`  Missing required field: "${field}"`);
    }
  }

  for (const [fieldName, schemaDefinition] of Object.entries(properties)) {
    if (!Object.hasOwn(spec, fieldName)) {
      continue;
    }

    const value = spec[fieldName];
    errors.push(...validateSchemaProperty(fieldName, schemaDefinition, value));
  }

  return errors;
}

/**
 * Validates one top-level property against its schema definition.
 *
 * @param {string} fieldName - Property name.
 * @param {Record<string, unknown>} schemaDefinition - JSON schema property definition.
 * @param {unknown} value - Property value.
 * @returns {string[]} Validation errors.
 */
function validateSchemaProperty(fieldName, schemaDefinition, value) {
  const errors = [];

  if (schemaDefinition['type'] === 'string' && typeof value !== 'string') {
    errors.push(`  "${fieldName}" must be a string`);
  }

  const isObjectValue = typeof value === 'object' && value !== null && !Array.isArray(value);
  if (schemaDefinition['type'] === 'object' && !isObjectValue) {
    errors.push(`  "${fieldName}" must be an object`);
  }

  if (schemaDefinition['type'] === 'array' && !Array.isArray(value)) {
    errors.push(`  "${fieldName}" must be an array`);
  }

  if (Object.hasOwn(schemaDefinition, 'const') && value !== schemaDefinition['const']) {
    errors.push(
      `  "${fieldName}" must equal ${JSON.stringify(schemaDefinition['const'])} (got ${JSON.stringify(value)})`,
    );
  }

  return errors;
}

// ─── Schema validation ────────────────────────────────────────────────────────

/**
 * Validates that a value is a non-empty string.
 *
 * @param {unknown} value - Value to test.
 * @returns {boolean} True when value is a non-empty string.
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates a single BDD scenario object.
 *
 * @param {unknown} scenario - Candidate scenario.
 * @param {string} specPath - Path of the BDD file (for error context).
 * @param {string} featureName - Owning feature name (for error context).
 * @param {number} scenarioIndex - Zero-based scenario index.
 * @returns {string[]} List of validation error messages.
 */
function validateScenario(scenario, specPath, featureName, scenarioIndex) {
  const errors = [];
  const prefix = `  scenario[${scenarioIndex}] in feature "${featureName}"`;

  if (typeof scenario !== 'object' || scenario === null) {
    errors.push(`${prefix}: must be an object`);
    return errors;
  }

  for (const field of ['name', 'given', 'when', 'then']) {
    if (!isNonEmptyString(scenario[field])) {
      errors.push(`${prefix}: "${field}" must be a non-empty string`);
    }
  }

  if (isNonEmptyString(scenario['name']) && !/^should\b/.test(scenario['name'])) {
    errors.push(`${prefix}: "name" must start with "should" (got "${scenario['name']}")`);
  }

  return errors;
}

/**
 * Validates a single feature object within a BDD spec.
 *
 * @param {unknown} feature - Candidate feature.
 * @param {string} specPath - Path of the BDD file (for error context).
 * @param {number} featureIndex - Zero-based feature index.
 * @returns {string[]} List of validation error messages.
 */
function validateFeature(feature, specPath, featureIndex) {
  const errors = [];
  const prefix = `  feature[${featureIndex}]`;

  if (typeof feature !== 'object' || feature === null) {
    errors.push(`${prefix}: must be an object`);
    return errors;
  }

  if (!isNonEmptyString(feature['feature'])) {
    errors.push(`${prefix}: "feature" must be a non-empty string`);
  }

  const featureName = isNonEmptyString(feature['feature'])
    ? feature['feature']
    : `<index ${featureIndex}>`;

  if (!Array.isArray(feature['scenarios'])) {
    errors.push(`${prefix}: "scenarios" must be an array`);
  } else if (feature['scenarios'].length === 0) {
    errors.push(`${prefix}: "scenarios" must not be empty`);
  } else {
    for (let i = 0; i < feature['scenarios'].length; i++) {
      errors.push(...validateScenario(feature['scenarios'][i], specPath, featureName, i));
    }
  }

  return errors;
}

/**
 * Validates a parsed BDD spec object against the bdd-spec.schema.json constraints.
 *
 * @param {unknown} spec - Parsed JSON content of a .ts.bdd.json file.
 * @param {string} specPath - Absolute path to the BDD file (for error messages).
 * @returns {string[]} List of validation error messages; empty when valid.
 */
function validateSchema(spec, specPath) {
  const errors = validateTopLevelAgainstSchema(spec);

  if (typeof spec !== 'object' || spec === null) {
    return errors;
  }

  const detailErrors = [
    ...validateSourceFileValue(spec),
    ...validateModuleValue(spec),
    ...validateSpecificationsValue(spec, specPath),
  ];
  errors.push(...detailErrors);

  return errors;
}

/**
 * Validates sourceFile field semantics.
 *
 * @param {Record<string, unknown>} spec - BDD spec object.
 * @returns {string[]} Validation errors.
 */
function validateSourceFileValue(spec) {
  const errors = [];
  const sourceFile = typeof spec['sourceFile'] === 'string' ? spec['sourceFile'] : '';
  if (isNonEmptyString(sourceFile)) {
    const resolvedSource = join(REPO_ROOT, sourceFile);
    if (!existsSync(resolvedSource)) {
      errors.push(`  "sourceFile" points to a non-existent file: ${sourceFile}`);
    }
    return errors;
  }

  errors.push('  "sourceFile" must be a non-empty string');
  return errors;
}

/**
 * Validates module object semantics.
 *
 * @param {Record<string, unknown>} spec - BDD spec object.
 * @returns {string[]} Validation errors.
 */
function validateModuleValue(spec) {
  const errors = [];
  const mod = spec['module'];
  const isModuleObject = typeof mod === 'object' && mod !== null;
  if (!isModuleObject) {
    errors.push('  "module" must be an object');
    return errors;
  }

  if (!isNonEmptyString(mod['name'])) {
    errors.push('  "module.name" must be a non-empty string');
  }
  if (!isNonEmptyString(mod['description'])) {
    errors.push('  "module.description" must be a non-empty string');
  }

  if (Array.isArray(mod['exports'])) {
    for (let i = 0; i < mod['exports'].length; i++) {
      if (!isNonEmptyString(mod['exports'][i])) {
        errors.push(`  "module.exports[${i}]" must be a non-empty string`);
      }
    }
    return errors;
  }

  errors.push('  "module.exports" must be an array');
  return errors;
}

/**
 * Validates specifications array semantics.
 *
 * @param {Record<string, unknown>} spec - BDD spec object.
 * @param {string} specPath - BDD file path for context.
 * @returns {string[]} Validation errors.
 */
function validateSpecificationsValue(spec, specPath) {
  const errors = [];
  const specifications = spec['specifications'];
  if (!Array.isArray(specifications)) {
    errors.push('  "specifications" must be an array');
    return errors;
  }

  if (specifications.length === 0) {
    errors.push('  "specifications" must not be empty');
    return errors;
  }

  for (let i = 0; i < specifications.length; i++) {
    errors.push(...validateFeature(specifications[i], specPath, i));
  }
  return errors;
}

// ─── Individual checks ────────────────────────────────────────────────────────

/**
 * Runs schema validation on every discovered BDD file.
 *
 * @param {string[]} bddFiles - Absolute paths to all .ts.bdd.json files.
 * @returns {{ file: string; errors: string[] }[]} Files with schema errors.
 */
function checkSchemaCompliance(bddFiles) {
  const failures = [];
  for (const bddPath of bddFiles) {
    let spec;
    try {
      spec = JSON.parse(readFileSync(bddPath, 'utf8'));
    } catch (err) {
      failures.push({ file: bddPath, errors: [`  Failed to parse JSON: ${err.message}`] });
      continue;
    }
    const errors = validateSchema(spec, bddPath);
    if (errors.length > 0) {
      failures.push({ file: bddPath, errors });
    }
  }
  return failures;
}

/**
 * Finds BDD files that reference a sourceFile which does not exist on disk.
 *
 * @param {string[]} bddFiles - Absolute paths to all .ts.bdd.json files.
 * @param {Set<string>} sourceFileSet - Absolute paths of known source files.
 * @returns {string[]} Absolute paths of abandoned BDD files.
 */
function checkOrphanedSpecs(bddFiles, sourceFileSet) {
  const orphans = [];
  for (const bddPath of bddFiles) {
    // Derive expected source path from sibling naming convention
    const expectedSource = bddPath.slice(0, -BDD_EXTENSION.length);
    if (!sourceFileSet.has(expectedSource)) {
      orphans.push(bddPath);
    }
  }
  return orphans;
}

/**
 * Finds source files that are missing a sibling .ts.bdd.json file.
 *
 * @param {string[]} sourceFiles - Absolute paths of all non-test .ts source files.
 * @param {Set<string>} bddFileSet - Absolute paths of all known BDD files.
 * @returns {string[]} Absolute paths of source files without a BDD spec.
 */
function checkMissingSpecs(sourceFiles, bddFileSet) {
  return sourceFiles.filter((srcPath) => !bddFileSet.has(srcPath + BDD_EXTENSION));
}

/**
 * Verifies that every name listed in module.exports exists as a named export in
 * the corresponding source file.
 *
 * @param {string[]} bddFiles - Absolute paths to all .ts.bdd.json files.
 * @returns {{ file: string; missing: string[] }[]} Files with mismatched exports.
 */
function checkExportCoverage(bddFiles) {
  const failures = [];
  for (const bddPath of bddFiles) {
    let spec;
    try {
      spec = JSON.parse(readFileSync(bddPath, 'utf8'));
    } catch {
      // JSON parse errors are already reported in schema check; skip here.
      continue;
    }

    const declaredExports = Array.isArray(spec?.module?.exports) ? spec.module.exports : [];
    if (declaredExports.length === 0) continue;

    const sourcePath = bddPath.slice(0, -BDD_EXTENSION.length);
    if (!existsSync(sourcePath)) continue; // orphan check covers this

    const sourceContent = readFileSync(sourcePath, 'utf8');
    const actualExports = extractNamedExports(sourceContent);

    const missingInSource = declaredExports.filter((name) => !actualExports.has(name));
    const missingInSpec = [...actualExports].filter((name) => !declaredExports.includes(name));

    if (missingInSource.length > 0 || missingInSpec.length > 0) {
      failures.push({ file: bddPath, missingInSource, missingInSpec });
    }
  }
  return failures;
}

// ─── Reporting ────────────────────────────────────────────────────────────────

/** ANSI colour helpers (suppressed when NO_COLOR is set). */
const NO_COLOR = process.env['NO_COLOR'] !== undefined;
const red = (s) => (NO_COLOR ? s : `\x1b[31m${s}\x1b[0m`);
const yellow = (s) => (NO_COLOR ? s : `\x1b[33m${s}\x1b[0m`);
const green = (s) => (NO_COLOR ? s : `\x1b[32m${s}\x1b[0m`);
const bold = (s) => (NO_COLOR ? s : `\x1b[1m${s}\x1b[0m`);

/**
 * Returns a workspace-relative display path for a given absolute path.
 *
 * @param {string} absolutePath - Absolute file path.
 * @returns {string} Relative path using forward slashes.
 */
function relPath(absolutePath) {
  return absolutePath.replaceAll(REPO_ROOT, '').replaceAll('\\', '/').replace(/^\//, '');
}

/**
 * Prints all validation results and returns whether any failures were found.
 *
 * @param {object} results - Collected results from all checks.
 * @returns {boolean} True when at least one error was found.
 */
function report(results) {
  const { schemaFailures, orphans, missing, exportFailures } = results;
  const hasErrors =
    printSchemaFailures(schemaFailures) ||
    printOrphanFailures(orphans) ||
    printMissingFailures(missing) ||
    printExportFailures(exportFailures);

  if (!hasErrors) {
    console.log(
      green(`\n✓ All ${results.totalBdd} BDD spec file(s) are valid.`) +
        ` (${results.totalSource} source file(s) checked)`,
    );
  }

  return hasErrors;
}

/**
 * Prints schema failures.
 *
 * @param {{ file: string; errors: string[] }[]} schemaFailures - Schema failures.
 * @returns {boolean} True when failures were printed.
 */
function printSchemaFailures(schemaFailures) {
  if (schemaFailures.length === 0) {
    return false;
  }

  console.error(bold(red(`\nSchema violations (${schemaFailures.length} file(s)):`)));
  for (const { file, errors } of schemaFailures) {
    console.error(`  ${red('✗')} ${relPath(file)}`);
    for (const err of errors) {
      console.error(`    ${yellow('→')} ${err.trim()}`);
    }
  }
  return true;
}

/**
 * Prints orphaned BDD file failures.
 *
 * @param {string[]} orphans - Orphaned BDD files.
 * @returns {boolean} True when failures were printed.
 */
function printOrphanFailures(orphans) {
  if (orphans.length === 0) {
    return false;
  }

  console.error(
    bold(red(`\nAbandoned BDD files — no matching source file (${orphans.length} file(s)):`)),
  );
  for (const file of orphans) {
    console.error(`  ${red('✗')} ${relPath(file)}`);
  }
  return true;
}

/**
 * Prints missing BDD file failures.
 *
 * @param {string[]} missing - Source files missing BDD specs.
 * @returns {boolean} True when failures were printed.
 */
function printMissingFailures(missing) {
  if (missing.length === 0) {
    return false;
  }

  console.error(
    bold(red(`\nMissing BDD specs — source files without a spec (${missing.length} file(s)):`)),
  );
  for (const file of missing) {
    console.error(`  ${red('✗')} ${relPath(file)}`);
  }
  return true;
}

/**
 * Prints export parity failures.
 *
 * @param {{ file: string; missingInSource: string[]; missingInSpec: string[] }[]} exportFailures - Export mismatches.
 * @returns {boolean} True when failures were printed.
 */
function printExportFailures(exportFailures) {
  if (exportFailures.length === 0) {
    return false;
  }

  console.error(
    bold(
      red(
        `\nExport mismatches — module.exports and named exports must match exactly (${exportFailures.length} file(s)):`,
      ),
    ),
  );
  for (const { file, missingInSource, missingInSpec } of exportFailures) {
    console.error(`  ${red('✗')} ${relPath(file)}`);
    for (const name of missingInSource) {
      console.error(`    ${yellow('→')} "${name}" is not a named export in the source file`);
    }
    for (const name of missingInSpec) {
      console.error(
        `    ${yellow('→')} "${name}" is exported by source but missing from module.exports`,
      );
    }
  }
  return true;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Runs all BDD validation checks and exits with the appropriate code.
 */
function run() {
  console.log(bold('Validating BDD specification files…'));

  const bddFiles = collectBddFiles();
  const sourceFiles = collectSourceFiles();

  const bddFileSet = new Set(bddFiles);
  const sourceFileSet = new Set(sourceFiles);

  const results = {
    totalBdd: bddFiles.length,
    totalSource: sourceFiles.length,
    schemaFailures: checkSchemaCompliance(bddFiles),
    orphans: checkOrphanedSpecs(bddFiles, sourceFileSet),
    missing: checkMissingSpecs(sourceFiles, bddFileSet),
    exportFailures: checkExportCoverage(bddFiles),
  };

  const hasErrors = report(results);
  process.exit(hasErrors ? 1 : 0);
}

run();
