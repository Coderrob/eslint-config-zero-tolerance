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

import { existsSync, readFileSync } from 'node:fs';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isPlainObject, isString } from '../helpers/type-guards';
import { createRule } from './support/rule-factory';

export enum RequireBddSpecMessageId {
  InvalidBddSpec = 'invalidBddSpec',
  MissingBddSpec = 'missingBddSpec',
}

interface IParseErrorSpec {
  __parseError: string;
}

type RequireBddSpecContext = Readonly<TSESLint.RuleContext<RequireBddSpecMessageId, []>>;

const BDD_EXTENSION = '.bdd.json';
const EXPORT_DECLARATION_PATTERN =
  /^export\s+(?:const|let|var|function\*?|class|enum|abstract\s+class|type|interface)\s+(\w+)/gm;
const EXPORT_LIST_PATTERN = /^export\s*\{([^}]+)\}(?:\s*from\s*['"][^'"]+['"])?/gm;
const REQUIRED_TOP_LEVEL_FIELDS = [
  '$schema',
  'schemaVersion',
  'sourceFile',
  'module',
  'specifications',
];
const SCENARIO_FIELDS = ['name', 'given', 'when', 'then'];
const SCHEMA_VERSION = '1.0.0';
const TEST_SUFFIX = '.test.ts';

/**
 * Collects declaration-style export names.
 *
 * @param content - Source file text.
 * @param exportedNames - Mutable set of export names.
 */
function addDeclarationExports(content: string, exportedNames: Readonly<Set<string>>): void {
  let match: RegExpExecArray | null = EXPORT_DECLARATION_PATTERN.exec(content);
  while (match !== null) {
    exportedNames.add(match[1]);
    match = EXPORT_DECLARATION_PATTERN.exec(content);
  }
}

/**
 * Adds one validated export name.
 *
 * @param exportedName - Candidate export name.
 * @param exportedNames - Mutable set of export names.
 */
function addExportIfValid(exportedName: string, exportedNames: Readonly<Set<string>>): void {
  if (/^\w+$/u.test(exportedName)) {
    exportedNames.add(exportedName);
  }
}

/**
 * Collects export-list export names.
 *
 * @param content - Source file text.
 * @param exportedNames - Mutable set of export names.
 */
function addListExports(content: string, exportedNames: Readonly<Set<string>>): void {
  let match: RegExpExecArray | null = EXPORT_LIST_PATTERN.exec(content);
  while (match !== null) {
    for (const segment of match[1].split(',')) {
      const exportedName = extractExportedName(segment);
      if (exportedName !== null) {
        addExportIfValid(exportedName, exportedNames);
      }
    }
    match = EXPORT_LIST_PATTERN.exec(content);
  }
}

/**
 * Appends one validation error to the accumulator.
 *
 * @param errors - Error accumulator.
 * @param message - Validation message to append.
 */
function appendError(errors: readonly string[], message: string): void {
  Reflect.apply(Array.prototype.push, errors, [message]);
}

/**
 * Adds source/spec export parity errors.
 *
 * @param spec - Parsed BDD spec.
 * @param sourceContent - Source file text.
 * @param errors - Mutable error accumulator.
 */
function appendExportParityErrors(
  spec: Readonly<Record<string, unknown>>,
  sourceContent: string,
  errors: readonly string[],
): void {
  const moduleRecord = getModuleRecord(spec);
  if (moduleRecord === null || !Array.isArray(moduleRecord['exports'])) {
    return;
  }
  const declaredExports = collectDeclaredExports(moduleRecord['exports']);
  const actualExports = extractNamedExports(sourceContent);
  pushMissingSourceExports(declaredExports, actualExports, errors);
  pushMissingSpecExports(declaredExports, actualExports, errors);
}

/**
 * Adds feature-level validation errors.
 *
 * @param feature - Feature value.
 * @param featureIndex - Zero-based feature index.
 * @param errors - Mutable error accumulator.
 */
function appendFeatureErrors(
  feature: unknown,
  featureIndex: number,
  errors: readonly string[],
): void {
  const prefix = `feature[${featureIndex}]`;
  if (!isPlainObject(feature)) {
    appendError(errors, `${prefix}: must be an object`);
    return;
  }
  appendFeatureNameError(feature, prefix, errors);
  appendFeatureScenariosErrors(feature, featureIndex, prefix, errors);
}

/**
 * Adds feature-name errors.
 *
 * @param feature - Feature object.
 * @param prefix - Feature location prefix.
 * @param errors - Mutable error accumulator.
 */
function appendFeatureNameError(
  feature: Readonly<Record<string, unknown>>,
  prefix: string,
  errors: readonly string[],
): void {
  if (!isNonEmptyString(feature['feature'])) {
    appendError(errors, `${prefix}: "feature" must be a non-empty string`);
  }
}

/**
 * Adds feature-scenarios errors.
 *
 * @param feature - Feature object.
 * @param featureIndex - Zero-based feature index.
 * @param prefix - Feature location prefix.
 * @param errors - Mutable error accumulator.
 */
function appendFeatureScenariosErrors(
  feature: Readonly<Record<string, unknown>>,
  featureIndex: number,
  prefix: string,
  errors: readonly string[],
): void {
  const scenarios = feature['scenarios'];
  if (!Array.isArray(scenarios)) {
    appendError(errors, `${prefix}: "scenarios" must be an array`);
    return;
  }
  if (scenarios.length === 0) {
    appendError(errors, `${prefix}: "scenarios" must not be empty`);
    return;
  }
  appendScenarioErrors(scenarios, getFeatureName(feature, featureIndex), errors);
}

/**
 * Adds top-level field type errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendFieldTypeErrors(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  appendSchemaFieldTypeError(spec, errors);
  appendSourceFileTypeError(spec, errors);
  appendTopLevelModuleTypeError(spec, errors);
  appendTopLevelSpecificationsTypeError(spec, errors);
}

/**
 * Adds missing required-field errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendMissingRequiredFieldErrors(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!hasOwnField(spec, field)) {
      appendError(errors, `Missing required field: "${field}"`);
    }
  }
}

/**
 * Adds module semantic errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendModuleDescriptionError(
  moduleRecord: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (!isNonEmptyString(moduleRecord['description'])) {
    appendError(errors, '"module.description" must be a non-empty string');
  }
}

/**
 * Adds module.description errors.
 *
 * @param moduleRecord - Module object.
 * @param errors - Mutable error accumulator.
 */
function appendModuleErrors(
  moduleRecord: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  appendModuleNameError(moduleRecord, errors);
  appendModuleDescriptionError(moduleRecord, errors);
  appendModuleExportsErrors(moduleRecord, errors);
}

/**
 * Adds module.exports errors.
 *
 * @param moduleRecord - Module object.
 * @param errors - Mutable error accumulator.
 */
function appendModuleExportsErrors(
  moduleRecord: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (!Array.isArray(moduleRecord['exports'])) {
    appendError(errors, '"module.exports" must be an array');
    return;
  }
  pushModuleExportEntryErrors(moduleRecord['exports'], errors);
}

/**
 * Adds module.name errors.
 *
 * @param moduleRecord - Module object.
 * @param errors - Mutable error accumulator.
 */
function appendModuleNameError(
  moduleRecord: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (!isNonEmptyString(moduleRecord['name'])) {
    appendError(errors, '"module.name" must be a non-empty string');
  }
}

/**
 * Adds scenario validation errors.
 *
 * @param scenarios - Scenario array.
 * @param featureName - Feature display name.
 * @param errors - Mutable error accumulator.
 */
function appendScenarioErrors(
  scenarios: ReadonlyArray<unknown>,
  featureName: string,
  errors: readonly string[],
): void {
  for (let i = 0; i < scenarios.length; i += 1) {
    pushScenarioFieldErrors(scenarios[i], featureName, i, errors);
  }
}

/**
 * Adds schemaVersion equality errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendSchemaFieldTypeError(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (hasOwnField(spec, '$schema') && typeof spec['$schema'] !== 'string') {
    appendError(errors, '"$schema" must be a string');
  }
}

/**
 * Adds scenario collection errors.
 *
 * @param scenarios - Scenario array.
 * @param featureName - Feature display name.
 * @param errors - Mutable error accumulator.
 */
function appendSchemaVersionError(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (!hasOwnField(spec, 'schemaVersion')) {
    return;
  }
  if (spec['schemaVersion'] === SCHEMA_VERSION) {
    return;
  }
  appendError(
    errors,
    `"schemaVersion" must equal "${SCHEMA_VERSION}" (got ${JSON.stringify(spec['schemaVersion'])})`,
  );
}

/**
 * Adds sourceFile existence errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendSourceFileErrors(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  const sourceFile = spec['sourceFile'];
  if (!isNonEmptyString(sourceFile)) {
    appendError(errors, '"sourceFile" must be a non-empty string');
    return;
  }
  if (!existsSync(sourceFile)) {
    appendError(errors, `"sourceFile" points to a non-existent file: ${sourceFile}`);
  }
}

/**
 * Adds top-level sourceFile type errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendSourceFileTypeError(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (hasOwnField(spec, 'sourceFile') && typeof spec['sourceFile'] !== 'string') {
    appendError(errors, '"sourceFile" must be a string');
  }
}

/**
 * Adds specifications semantic errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendSpecificationsErrors(
  specifications: ReadonlyArray<unknown>,
  errors: readonly string[],
): void {
  if (specifications.length === 0) {
    appendError(errors, '"specifications" must not be empty');
    return;
  }
  for (let i = 0; i < specifications.length; i += 1) {
    appendFeatureErrors(specifications[i], i, errors);
  }
}

/**
 * Adds top-level module type errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendTopLevelModuleTypeError(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (hasOwnField(spec, 'module') && !isPlainObject(spec['module'])) {
    appendError(errors, '"module" must be an object');
  }
}

/**
 * Adds top-level specifications type errors.
 *
 * @param spec - Parsed BDD spec.
 * @param errors - Mutable error accumulator.
 */
function appendTopLevelSpecificationsTypeError(
  spec: Readonly<Record<string, unknown>>,
  errors: readonly string[],
): void {
  if (hasOwnField(spec, 'specifications') && !Array.isArray(spec['specifications'])) {
    appendError(errors, '"specifications" must be an array');
  }
}

/**
 * Handles Program node validation.
 *
 * @param context - ESLint rule context.
 * @param node - Program node.
 */
function checkProgram(
  context: Readonly<RequireBddSpecContext>,
  node: Readonly<TSESTree.Program>,
): void {
  const filename = context.filename;
  if (isTestFile(filename)) {
    return;
  }
  const specPath = getBddSpecPath(filename);
  if (!existsSync(specPath)) {
    reportMissingSpec(context, node, specPath);
    return;
  }
  const errors = collectInvalidSpecErrors(parseSpec(specPath), context.sourceCode.getText());
  if (errors.length > 0) {
    reportInvalidSpec(context, node, errors);
  }
}

/**
 * Collects string entries from module.exports.
 *
 * @param moduleExports - module.exports value.
 * @returns Declared export names.
 */
function collectDeclaredExports(moduleExports: readonly unknown[]): string[] {
  const declaredExports: string[] = [];
  for (const value of moduleExports) {
    if (isNonEmptyString(value)) {
      Reflect.apply(Array.prototype.push, declaredExports, [value]);
    }
  }
  return declaredExports;
}

/**
 * Collects all validation errors for one file.
 *
 * @param spec - Parsed JSON value.
 * @param sourceContent - Source file content.
 * @returns Validation error list.
 */
function collectInvalidSpecErrors(spec: unknown, sourceContent: string): string[] {
  if (isParseErrorSpec(spec)) {
    return [`Failed to parse JSON: ${spec.__parseError}`];
  }
  if (!isPlainObject(spec)) {
    return ['Root value must be a JSON object'];
  }
  const topLevelErrors = collectTopLevelErrors(spec);
  if (topLevelErrors.length > 0) {
    return topLevelErrors;
  }
  return collectSemanticErrors(spec, sourceContent);
}

/**
 * Collects semantic errors after top-level checks.
 *
 * @param spec - Parsed BDD spec.
 * @param sourceContent - Source file content.
 * @returns Semantic error list.
 */
function collectSemanticErrors(
  spec: Readonly<Record<string, unknown>>,
  sourceContent: string,
): string[] {
  const errors: string[] = [];
  /* istanbul ignore next */
  const moduleRecord = getModuleRecord(spec) ?? {};
  /* istanbul ignore next */
  const specifications = getSpecificationsArray(spec) ?? [];
  appendModuleErrors(moduleRecord, errors);
  appendSourceFileErrors(spec, errors);
  appendSpecificationsErrors(specifications, errors);
  appendExportParityErrors(spec, sourceContent, errors);
  return errors;
}

/**
 * Collects top-level errors.
 *
 * @param spec - Parsed BDD spec.
 * @returns Top-level error list.
 */
function collectTopLevelErrors(spec: Readonly<Record<string, unknown>>): string[] {
  const errors: string[] = [];
  appendMissingRequiredFieldErrors(spec, errors);
  appendFieldTypeErrors(spec, errors);
  appendSchemaVersionError(spec, errors);
  return errors;
}

/**
 * Creates the rule listener map.
 *
 * @param context - ESLint rule context.
 * @returns Listener map.
 */
function createRequireBddSpecListeners(
  context: Readonly<RequireBddSpecContext>,
): TSESLint.RuleListener {
  return {
    Program: checkProgram.bind(undefined, context),
  };
}

/**
 * Extracts one exported name from a segment.
 *
 * @param segment - One export-list segment.
 * @returns Exported name or null.
 */
function extractExportedName(segment: string): string | null {
  const trimmed = segment.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return extractSegmentName(trimmed.split(/\s+as\s+/));
}

/**
 * Extracts all named exports from source text.
 *
 * @param content - Source file text.
 * @returns Named export set.
 */
function extractNamedExports(content: string): Set<string> {
  const exportedNames = new Set<string>();
  addDeclarationExports(content, exportedNames);
  addListExports(content, exportedNames);
  return exportedNames;
}

/**
 * Extracts the trailing identifier from split export segments.
 *
 * @param parts - Segment parts split on `as`.
 * @returns Valid identifier or null.
 */
function extractSegmentName(parts: ReadonlyArray<string>): string | null {
  /* istanbul ignore next */
  const rawValue = parts.at(-1) ?? '';
  const candidate = rawValue.trim();
  /* istanbul ignore next */
  return /^\w+$/u.test(candidate) ? candidate : null;
}

/**
 * Builds sibling BDD spec path.
 *
 * @param filename - Source filename.
 * @returns Sibling spec path.
 */
function getBddSpecPath(filename: string): string {
  return filename + BDD_EXTENSION;
}

/**
 * Gets feature name for diagnostics.
 *
 * @param feature - Feature object.
 * @param featureIndex - Zero-based feature index.
 * @returns Feature label.
 */
function getFeatureName(feature: Readonly<Record<string, unknown>>, featureIndex: number): string {
  return isNonEmptyString(feature['feature']) ? feature['feature'] : `<index ${featureIndex}>`;
}

/**
 * Gets the module record when valid.
 *
 * @param spec - Parsed BDD spec.
 * @returns Module record or null.
 */
function getModuleRecord(spec: Readonly<Record<string, unknown>>): Record<string, unknown> | null {
  /* istanbul ignore next */
  return isPlainObject(spec['module']) ? spec['module'] : null;
}

/**
 * Gets specifications array when valid.
 *
 * @param spec - Parsed BDD spec.
 * @returns Specifications array or null.
 */
function getSpecificationsArray(
  spec: Readonly<Record<string, unknown>>,
): ReadonlyArray<unknown> | null {
  /* istanbul ignore next */
  return Array.isArray(spec['specifications']) ? spec['specifications'] : null;
}

/**
 * Returns true when a field exists on an object.
 *
 * @param record - Candidate object.
 * @param field - Field name.
 * @returns True when field exists.
 */
function hasOwnField(record: Readonly<Record<string, unknown>>, field: string): boolean {
  return field in record;
}

/**
 * Returns true for non-empty strings.
 *
 * @param value - Candidate value.
 * @returns True when value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * Returns true when value is a parse-error marker.
 *
 * @param value - Candidate value.
 * @returns True when value is a parse-error spec.
 */
function isParseErrorSpec(value: unknown): value is IParseErrorSpec {
  return isPlainObject(value) && isNonEmptyString(value['__parseError']);
}

/**
 * Returns true when file is a test file.
 *
 * @param filename - Source filename.
 * @returns True for test files.
 */
function isTestFile(filename: string): boolean {
  return filename.endsWith(TEST_SUFFIX);
}

/**
 * Parses a BDD spec file.
 *
 * @param specPath - Absolute path to the BDD spec.
 * @returns Parsed JSON or parse-error marker.
 */
function parseSpec(specPath: string): unknown {
  try {
    return JSON.parse(readFileSync(specPath, 'utf8'));
  } catch (error) {
    /* istanbul ignore next */
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    return { __parseError: message };
  }
}

/**
 * Adds errors for source-missing declared exports.
 *
 * @param declaredExports - module.exports names.
 * @param actualExports - Source named exports.
 * @param errors - Mutable error accumulator.
 */
function pushMissingSourceExports(
  declaredExports: ReadonlyArray<string>,
  actualExports: Readonly<ReadonlySet<string>>,
  errors: readonly string[],
): void {
  for (const name of declaredExports) {
    if (!actualExports.has(name)) {
      appendError(
        errors,
        `"module.exports" lists "${name}" but it is not exported by the source file`,
      );
    }
  }
}

/**
 * Adds errors for source-missing declared exports.
 *
 * @param declaredExports - module.exports names.
 * @param actualExports - Source named exports.
 * @param errors - Mutable error accumulator.
 */
function pushMissingSpecExports(
  declaredExports: ReadonlyArray<string>,
  actualExports: Readonly<ReadonlySet<string>>,
  errors: readonly string[],
): void {
  for (const name of actualExports) {
    if (!declaredExports.includes(name)) {
      appendError(
        errors,
        `"module.exports" is missing "${name}" which is exported by the source file`,
      );
    }
  }
}

/**
 * Adds errors for spec-missing source exports.
 *
 * @param declaredExports - module.exports names.
 * @param actualExports - Source named exports.
 * @param errors - Mutable error accumulator.
 */
function pushModuleExportEntryErrors(
  moduleExports: readonly unknown[],
  errors: readonly string[],
): void {
  for (let i = 0; i < moduleExports.length; i += 1) {
    if (!isNonEmptyString(moduleExports[i])) {
      appendError(errors, `"module.exports[${i}]" must be a non-empty string`);
    }
  }
}

/**
 * Adds one scenario's errors.
 *
 * @param scenario - Scenario value.
 * @param featureName - Feature display name.
 * @param scenarioIndex - Zero-based scenario index.
 * @param errors - Mutable error accumulator.
 */
function pushScenarioFieldErrors(
  scenario: unknown,
  featureName: string,
  scenarioIndex: number,
  errors: readonly string[],
): void {
  const prefix = `scenario[${scenarioIndex}] in feature "${featureName}"`;
  if (!isPlainObject(scenario)) {
    appendError(errors, `${prefix}: must be an object`);
    return;
  }
  pushScenarioRequiredFieldErrors(scenario, prefix, errors);
  pushScenarioShouldPrefixError(scenario, prefix, errors);
}

/**
 * Adds scenario required-field errors.
 *
 * @param scenario - Scenario object.
 * @param prefix - Scenario prefix.
 * @param errors - Mutable error accumulator.
 */
function pushScenarioRequiredFieldErrors(
  scenario: Readonly<Record<string, unknown>>,
  prefix: string,
  errors: readonly string[],
): void {
  for (const field of SCENARIO_FIELDS) {
    if (!isNonEmptyString(scenario[field])) {
      appendError(errors, `${prefix}: "${field}" must be a non-empty string`);
    }
  }
}

/**
 * Adds scenario-name should-prefix errors.
 *
 * @param scenario - Scenario object.
 * @param prefix - Scenario prefix.
 * @param errors - Mutable error accumulator.
 */
function pushScenarioShouldPrefixError(
  scenario: Readonly<Record<string, unknown>>,
  prefix: string,
  errors: readonly string[],
): void {
  const scenarioName = scenario['name'];
  if (!isNonEmptyString(scenarioName)) {
    return;
  }
  if (!/^should\b/u.test(scenarioName)) {
    appendError(errors, `${prefix}: "name" must start with "should" (got "${scenarioName}")`);
  }
}

/**
 * Reports invalid-spec errors.
 *
 * @param context - ESLint rule context.
 * @param node - Program node.
 * @param errors - Validation error list.
 */
function reportInvalidSpec(
  context: Readonly<RequireBddSpecContext>,
  node: Readonly<TSESTree.Program>,
  errors: ReadonlyArray<string>,
): void {
  context.report({
    node,
    messageId: RequireBddSpecMessageId.InvalidBddSpec,
    data: { errors: errors.join('\n') },
  });
}

/**
 * Reports missing-spec error.
 *
 * @param context - ESLint rule context.
 * @param node - Program node.
 * @param specPath - Expected sibling spec path.
 */
function reportMissingSpec(
  context: Readonly<RequireBddSpecContext>,
  node: Readonly<TSESTree.Program>,
  specPath: string,
): void {
  context.report({
    node,
    messageId: RequireBddSpecMessageId.MissingBddSpec,
    data: { specPath },
  });
}

/** Enforces valid sibling .ts.bdd.json files for non-test TypeScript sources. */
export const requireBddSpec = createRule({
  name: 'require-bdd-spec',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce that every TypeScript source file has a valid sibling .ts.bdd.json BDD spec file',
    },
    messages: {
      [RequireBddSpecMessageId.InvalidBddSpec]: 'BDD spec validation failed:\n{{ errors }}',
      [RequireBddSpecMessageId.MissingBddSpec]: 'Missing BDD spec file: {{ specPath }}',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireBddSpecListeners,
});

export default requireBddSpec;
