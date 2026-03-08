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

import { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isParentDirectoryImportPath } from '../import-path-helpers';
import { createRule } from '../rule-factory';

const GROUP_SIDE_EFFECT = 0;
const GROUP_BUILTIN = 1;
const GROUP_EXTERNAL = 2;
const GROUP_PARENT = 3;
const GROUP_PEER = 4;
const GROUP_INDEX = 5;
const MIN_IMPORTS_TO_VALIDATE = 2;
const CURRENT_DIRECTORY_DOT = '.';
const RELATIVE_PATH_PREFIX = '.';
const NODE_PROTOCOL_PREFIX = 'node:';
const INDEX_IMPORT_PATTERN = /^\.\/index(\.\w+)?$/u;
const GROUP_NAMES: [string, string, string, string, string, string] = [
  'side-effect',
  'builtin',
  'external',
  'parent',
  'peer',
  'index',
];

type ImportGroup =
  | typeof GROUP_SIDE_EFFECT
  | typeof GROUP_BUILTIN
  | typeof GROUP_EXTERNAL
  | typeof GROUP_PARENT
  | typeof GROUP_PEER
  | typeof GROUP_INDEX;

type ImportEntry = Readonly<{
  group: ImportGroup;
  node: TSESTree.ImportDeclaration;
  value: string;
  valueLower: string;
}>;

type SortImportsContext = Readonly<TSESLint.RuleContext<string, []>>;
type SortImportsState = Readonly<{
  imports: ImportEntry[];
  reportedNodes: Set<TSESTree.ImportDeclaration>;
  sourceCode: Readonly<TSESLint.SourceCode>;
}>;

/**
 * Adds a normalized import entry to the collection.
 *
 * @param imports - Mutable import entry collection.
 * @param node - Import declaration node.
 */
function addImportEntry(imports: ImportEntry[], node: TSESTree.ImportDeclaration): void {
  const importPath = getImportSourceValue(node);
  imports.push({
    group: getImportGroup(importPath, node.specifiers.length === 0),
    node,
    value: importPath,
    valueLower: importPath.toLowerCase(),
  });
}

/**
 * Builds a fixer that swaps two import declarations and preserves spacing between them.
 *
 * @param sourceCode - ESLint source code helper.
 * @param previousImport - Import currently before the misplaced import.
 * @param currentImport - Import currently after the misplaced import.
 * @returns ESLint fix callback.
 */
function buildSwapFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousImport: TSESTree.ImportDeclaration,
  currentImport: TSESTree.ImportDeclaration,
): TSESLint.ReportFixFunction {
  return swapImports.bind(undefined, sourceCode, previousImport, currentImport);
}

/**
 * Creates Program:exit handler that validates and clears collected imports.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @returns Program exit callback.
 */
function createProgramExitHandler(context: SortImportsContext, imports: ImportEntry[]): () => void {
  return validateImports.bind(undefined, context, imports);
}

/**
 * Creates listeners for sort-imports rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createSortImportsListeners(context: SortImportsContext): TSESLint.RuleListener {
  const imports: ImportEntry[] = [];
  return {
    ImportDeclaration: addImportEntry.bind(undefined, imports),
    'Program:exit': createProgramExitHandler(context, imports),
  };
}

/**
 * Returns an import-group name for a group index.
 *
 * @param group - Numeric import group.
 * @returns Human-readable group name.
 */
function getGroupName(group: ImportGroup): string {
  return GROUP_NAMES[group];
}

/**
 * Returns group rank for an import path.
 *
 * @param importPath - Import source path.
 * @param isSideEffect - Whether the import has no specifiers.
 * @returns Numeric group rank.
 */
function getImportGroup(importPath: string, isSideEffect: boolean): ImportGroup {
  if (isSideEffect) {
    return GROUP_SIDE_EFFECT;
  }
  if (importPath.startsWith(RELATIVE_PATH_PREFIX)) {
    return getRelativeImportGroup(importPath);
  }
  return isBuiltinImportPath(importPath) ? GROUP_BUILTIN : GROUP_EXTERNAL;
}

/**
 * Returns source path text from an import declaration.
 *
 * @param node - Import declaration node.
 * @returns Import path text.
 */
function getImportSourceValue(node: TSESTree.ImportDeclaration): string {
  return node.source.value;
}

/**
 * Returns group rank for relative import paths.
 *
 * @param importPath - Relative import path.
 * @returns Group rank for parent, index, or peer paths.
 */
function getRelativeImportGroup(importPath: string): ImportGroup {
  if (isParentDirectoryImportPath(importPath)) {
    return GROUP_PARENT;
  }
  return isIndexImportPath(importPath) ? GROUP_INDEX : GROUP_PEER;
}

/**
 * Returns true when at least two imports exist.
 *
 * @param imports - Collected imports.
 * @returns True when ordering validation should run.
 */
function hasAtLeastTwoImports(imports: ImportEntry[]): boolean {
  return imports.length >= MIN_IMPORTS_TO_VALIDATE;
}

/**
 * Returns true when path uses the node: protocol for Node.js built-in modules.
 *
 * @param importPath - Import path to check.
 * @returns True if the path starts with `node:`.
 */
function isBuiltinImportPath(importPath: string): boolean {
  return importPath.startsWith(NODE_PROTOCOL_PREFIX);
}

/**
 * Returns true when path is current-directory index import.
 *
 * @param importPath - Import path to check.
 * @returns True for `.` and `./index` variants.
 */
function isIndexImportPath(importPath: string): boolean {
  if (importPath === CURRENT_DIRECTORY_DOT) {
    return true;
  }
  return INDEX_IMPORT_PATTERN.test(importPath);
}

/**
 * Reports alphabetical inversions for imports within the same group.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @param reportedNodes - Nodes already reported.
 * @param sourceCode - ESLint source code helper.
 */
function reportAlphabeticalViolations(context: SortImportsContext, state: SortImportsState): void {
  for (let index = 1; index < state.imports.length; index += 1) {
    const previousEntry = state.imports[index - 1];
    const currentEntry = state.imports[index];
    reportUnsortedImportIfNeeded(context, state, previousEntry, currentEntry);
  }
}

/**
 * Reports backward group-order violations.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @param reportedNodes - Nodes already reported.
 * @param sourceCode - ESLint source code helper.
 */
function reportBackwardGroupViolations(context: SortImportsContext, state: SortImportsState): void {
  for (let index = state.imports.length - 1; index > 0; index -= 1) {
    const currentEntry = state.imports[index - 1];
    const nextEntry = state.imports[index];
    reportWrongGroupAfterIfNeeded(context, state, currentEntry, nextEntry);
  }
}

/**
 * Reports forward group-order violations.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @param reportedNodes - Nodes already reported.
 * @param sourceCode - ESLint source code helper.
 */
function reportForwardGroupViolations(context: SortImportsContext, state: SortImportsState): void {
  for (let index = 1; index < state.imports.length; index += 1) {
    const previousEntry = state.imports[index - 1];
    const currentEntry = state.imports[index];
    reportWrongGroupIfNeeded(context, state, previousEntry, currentEntry);
  }
}

/**
 * Reports unsorted import violation when two entries are out of order in the same group.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @param previousEntry - Previous import entry.
 * @param currentEntry - Current import entry.
 * @param reportedNodes - Nodes already reported.
 * @param sourceCode - ESLint source code helper.
 */
function reportUnsortedImportIfNeeded(
  context: SortImportsContext,
  state: SortImportsState,
  previousEntry: ImportEntry,
  currentEntry: ImportEntry,
): void {
  if (state.reportedNodes.has(currentEntry.node) || currentEntry.group !== previousEntry.group) {
    return;
  }
  if (currentEntry.valueLower >= previousEntry.valueLower) {
    return;
  }
  reportUnsortedImportViolation(context, state, previousEntry, currentEntry);
  state.reportedNodes.add(currentEntry.node);
}

/**
 * Reports unsorted-import ESLint diagnostic.
 *
 * @param context - ESLint rule execution context.
 * @param state - Shared sort state.
 * @param previousEntry - Previous import entry.
 * @param currentEntry - Current import entry.
 * @param data - Message payload.
 */
function reportUnsortedImportViolation(
  context: SortImportsContext,
  state: SortImportsState,
  previousEntry: ImportEntry,
  currentEntry: ImportEntry,
): void {
  context.report({
    node: currentEntry.node,
    messageId: 'unsortedImport',
    data: { current: currentEntry.value, previous: previousEntry.value },
    fix: buildSwapFix(state.sourceCode, previousEntry.node, currentEntry.node),
  });
}

/**
 * Reports wrong-group-after violation when current entry should come after next entry.
 *
 * @param context - ESLint rule execution context.
 * @param state - Shared sort state.
 * @param currentEntry - Current import entry.
 * @param nextEntry - Next import entry.
 */
function reportWrongGroupAfterIfNeeded(
  context: SortImportsContext,
  state: SortImportsState,
  currentEntry: ImportEntry,
  nextEntry: ImportEntry,
): void {
  if (state.reportedNodes.has(currentEntry.node) || currentEntry.group <= nextEntry.group) {
    return;
  }
  reportWrongGroupAfterViolation(context, state, currentEntry, nextEntry);
  state.reportedNodes.add(currentEntry.node);
}

/**
 * Reports wrong-group-after ESLint diagnostic.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @param currentEntry - Current import entry.
 * @param nextEntry - Next import entry.
 * @param sourceCode - ESLint source code helper.
 */
function reportWrongGroupAfterViolation(
  context: SortImportsContext,
  state: SortImportsState,
  currentEntry: ImportEntry,
  nextEntry: ImportEntry,
): void {
  context.report({
    node: currentEntry.node,
    messageId: 'wrongGroupAfter',
    data: {
      current: currentEntry.value,
      currentGroup: getGroupName(currentEntry.group),
      next: nextEntry.value,
      nextGroup: getGroupName(nextEntry.group),
    },
    fix: buildSwapFix(state.sourceCode, currentEntry.node, nextEntry.node),
  });
}

/**
 * Reports wrong-group violation when current entry should come before previous entry.
 *
 * @param context - ESLint rule execution context.
 * @param state - Shared sort state.
 * @param previousEntry - Previous import entry.
 * @param currentEntry - Current import entry.
 */
function reportWrongGroupIfNeeded(
  context: SortImportsContext,
  state: SortImportsState,
  previousEntry: ImportEntry,
  currentEntry: ImportEntry,
): void {
  if (state.reportedNodes.has(currentEntry.node) || currentEntry.group >= previousEntry.group) {
    return;
  }
  reportWrongGroupViolation(context, state, previousEntry, currentEntry);
  state.reportedNodes.add(currentEntry.node);
}

/**
 * Reports wrong-group ESLint diagnostic.
 *
 * @param context - ESLint rule execution context.
 * @param state - Shared sort state.
 * @param previousEntry - Previous import entry.
 * @param currentEntry - Current import entry.
 */
function reportWrongGroupViolation(
  context: SortImportsContext,
  state: SortImportsState,
  previousEntry: ImportEntry,
  currentEntry: ImportEntry,
): void {
  context.report({
    node: currentEntry.node,
    messageId: 'wrongGroup',
    data: {
      current: currentEntry.value,
      currentGroup: getGroupName(currentEntry.group),
      previous: previousEntry.value,
      previousGroup: getGroupName(previousEntry.group),
    },
    fix: buildSwapFix(state.sourceCode, previousEntry.node, currentEntry.node),
  });
}

/**
 * Swaps two import declaration ranges.
 *
 * @param sourceCode - ESLint source code helper.
 * @param previousImport - Previous import declaration.
 * @param currentImport - Current import declaration.
 * @param fixer - ESLint fixer.
 * @returns ESLint text replacement fix.
 */
function swapImports(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousImport: TSESTree.ImportDeclaration,
  currentImport: TSESTree.ImportDeclaration,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  const previousText = sourceCode.getText(previousImport);
  const currentText = sourceCode.getText(currentImport);
  const betweenText = sourceCode.text.slice(previousImport.range[1], currentImport.range[0]);
  const replacement = `${currentText}${betweenText}${previousText}`;
  return fixer.replaceTextRange([previousImport.range[0], currentImport.range[1]], replacement);
}

/**
 * Validates import ordering and reports all violations.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 */
function validateImports(context: SortImportsContext, imports: ImportEntry[]): void {
  if (!hasAtLeastTwoImports(imports)) {
    imports.length = 0;
    return;
  }
  const state: SortImportsState = {
    imports,
    reportedNodes: new Set<TSESTree.ImportDeclaration>(),
    sourceCode: context.sourceCode,
  };
  reportForwardGroupViolations(context, state);
  reportBackwardGroupViolations(context, state);
  reportAlphabeticalViolations(context, state);
  imports.length = 0;
}

/** Enforces top-level import grouping and alphabetical ordering with adjacent-swap fixes. */
export const sortImports = createRule({
  name: 'sort-imports',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Require import declarations to be grouped (side-effect -> builtin -> external -> parent -> peer -> index) and sorted alphabetically within each group',
    },
    messages: {
      unsortedImport: 'Import "{{current}}" should come before "{{previous}}"',
      wrongGroup:
        'Import "{{current}}" ({{currentGroup}}) must appear before "{{previous}}" ({{previousGroup}})',
      wrongGroupAfter:
        'Import "{{current}}" ({{currentGroup}}) must appear after "{{next}}" ({{nextGroup}})',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createSortImportsListeners,
});

export default sortImports;
