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

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isParentDirectoryImportPath } from '../helpers/import-path-helpers';
import { createRule } from './support/rule-factory';

const MIN_IMPORTS_TO_VALIDATE = 2;
const CURRENT_DIRECTORY_DOT = '.';
const RELATIVE_PATH_PREFIX = '.';
const NODE_PROTOCOL_PREFIX = 'node:';
const INDEX_IMPORT_PATTERN = /^\.\/index(\.\w+)?$/u;

enum ImportGroup {
  SideEffect = 0,
  Builtin = 1,
  External = 2,
  Parent = 3,
  Peer = 4,
  Index = 5,
}

const GROUP_NAMES: [string, string, string, string, string, string] = [
  'side-effect',
  'builtin',
  'external',
  'parent',
  'peer',
  'index',
];

type ImportEntry = Readonly<{
  group: ImportGroup;
  node: TSESTree.ImportDeclaration;
  value: string;
  valueLower: string;
}>;
type SortableImportBlock = ImportEntry &
  Readonly<{
    end: number;
    start: number;
    text: string;
  }>;
type ImportGroupInputs = Readonly<{
  importPath: string;
  isSideEffect: boolean;
}>;

type SortImportsContext = Readonly<TSESLint.RuleContext<string, []>>;
type SortImportsState = Readonly<{
  imports: readonly ImportEntry[];
  reportedNodes: Set<TSESTree.ImportDeclaration>;
  sourceCode: Readonly<TSESLint.SourceCode>;
}>;

/**
 * Adds a normalized import entry to the collection.
 *
 * @param imports - Mutable import entry collection.
 * @param node - Import declaration node.
 */
function addImportEntry(
  imports: readonly ImportEntry[],
  node: Readonly<TSESTree.ImportDeclaration>,
): void {
  const importPath = getImportSourceValue(node);
  Reflect.apply(Array.prototype.push, imports, [
    {
      group: getImportGroup({
        importPath,
        isSideEffect: node.specifiers.length === 0,
      }),
      node,
      value: importPath,
      valueLower: importPath.toLowerCase(),
    },
  ]);
}

/**
 * Builds a fixer that sorts the complete safe import span in one pass.
 *
 * @param state - Shared sort state.
 * @returns ESLint fix callback, or null when comments, code, or side-effect movement make sorting unsafe.
 */
function buildSortFix(state: Readonly<SortImportsState>): TSESLint.ReportFixFunction | null {
  const blocks = getSortableImportBlocks(state.sourceCode, state.imports);
  if (hasUnsafeInterImportContent(state.sourceCode, blocks)) {
    return null;
  }
  const sortedBlocks = getSortedImportBlocks(blocks);
  if (!hasPreservedSideEffectPositions(blocks, sortedBlocks)) {
    return null;
  }
  return sortImportBlocks.bind(undefined, state.sourceCode, blocks, sortedBlocks);
}

/**
 * Compares imports by group and then case-insensitive path while preserving side-effect order.
 *
 * @param left - Left import entry.
 * @param right - Right import entry.
 * @returns Negative when left sorts first, positive when right sorts first, or zero for stable ties.
 */
function compareImportEntries(left: Readonly<ImportEntry>, right: Readonly<ImportEntry>): number {
  const groupComparison = compareImportGroups(left, right);
  if (groupComparison !== 0) {
    return groupComparison;
  }
  if (left.group === ImportGroup.SideEffect) {
    return 0;
  }
  return compareImportPaths(left, right);
}

/**
 * Compares configured import groups.
 *
 * @param left - Left import entry.
 * @param right - Right import entry.
 * @returns Numeric group-order comparison.
 */
function compareImportGroups(left: Readonly<ImportEntry>, right: Readonly<ImportEntry>): number {
  return left.group - right.group;
}

/**
 * Compares normalized import paths.
 *
 * @param left - Left import entry.
 * @param right - Right import entry.
 * @returns Case-insensitive path-order comparison.
 */
function compareImportPaths(left: Readonly<ImportEntry>, right: Readonly<ImportEntry>): number {
  if (left.valueLower < right.valueLower) {
    return -1;
  }
  return left.valueLower > right.valueLower ? 1 : 0;
}

/**
 * Creates Program:exit handler that validates and clears collected imports.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @returns Program exit callback.
 */
function createProgramExitHandler(
  context: Readonly<SortImportsContext>,
  imports: readonly ImportEntry[],
): () => void {
  return validateImports.bind(undefined, context, imports);
}

/**
 * Creates listeners for sort-imports rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createSortImportsListeners(context: Readonly<SortImportsContext>): TSESLint.RuleListener {
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
function getGroupName(group: Readonly<ImportGroup>): string {
  return GROUP_NAMES[group];
}

/**
 * Returns group rank for an import path.
 *
 * @param importPath - Import source path.
 * @param isSideEffect - Whether the import has no specifiers.
 * @returns Numeric group rank.
 */
function getImportGroup(inputs: Readonly<ImportGroupInputs>): ImportGroup {
  if (inputs.isSideEffect) {
    return ImportGroup.SideEffect;
  }
  if (inputs.importPath.startsWith(RELATIVE_PATH_PREFIX)) {
    return getRelativeImportGroup(inputs.importPath);
  }
  return isBuiltinImportPath(inputs.importPath) ? ImportGroup.Builtin : ImportGroup.External;
}

/**
 * Returns original whitespace between adjacent import declarations.
 *
 * @param sourceCode - ESLint source code helper.
 * @param blocks - Import blocks in source order.
 * @param block - Current block.
 * @param index - Current index after omitting the first block.
 * @returns Exact separator text.
 */
function getImportSeparator(
  sourceCode: Readonly<TSESLint.SourceCode>,
  blocks: ReadonlyArray<SortableImportBlock>,
  block: Readonly<SortableImportBlock>,
  index: number,
): string {
  return sourceCode.text.slice(blocks[index].end, block.start);
}

/**
 * Returns source path text from an import declaration.
 *
 * @param node - Import declaration node.
 * @returns Import path text.
 */
function getImportSourceValue(node: Readonly<TSESTree.ImportDeclaration>): string {
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
    return ImportGroup.Parent;
  }
  return isIndexImportPath(importPath) ? ImportGroup.Index : ImportGroup.Peer;
}

/**
 * Returns one exact sortable block for an import entry.
 *
 * @param sourceCode - ESLint source code helper.
 * @param entry - Import entry to convert.
 * @returns Import block with declaration range and text.
 */
function getSortableImportBlock(
  sourceCode: Readonly<TSESLint.SourceCode>,
  entry: Readonly<ImportEntry>,
): SortableImportBlock {
  return {
    ...entry,
    end: entry.node.range[1],
    start: entry.node.range[0],
    text: sourceCode.getText(entry.node),
  };
}

/**
 * Returns sortable source blocks for import entries.
 *
 * @param sourceCode - ESLint source code helper.
 * @param imports - Import entries in source order.
 * @returns Import blocks with exact declaration text.
 */
function getSortableImportBlocks(
  sourceCode: Readonly<TSESLint.SourceCode>,
  imports: ReadonlyArray<ImportEntry>,
): ReadonlyArray<SortableImportBlock> {
  return imports.map(getSortableImportBlock.bind(undefined, sourceCode));
}

/**
 * Returns sorted import blocks using stable immutable insertion.
 *
 * @param blocks - Import blocks in source order.
 * @returns Blocks in configured group and alphabetical order.
 */
function getSortedImportBlocks(
  blocks: ReadonlyArray<SortableImportBlock>,
): ReadonlyArray<SortableImportBlock> {
  return blocks.reduce<ReadonlyArray<SortableImportBlock>>(insertSortedImportBlock, []);
}

/**
 * Returns the full sorted import replacement text with original whitespace separators.
 *
 * @param sourceCode - ESLint source code helper.
 * @param originalBlocks - Import blocks in source order.
 * @param sortedBlocks - Import blocks in sorted order.
 * @returns Complete replacement text.
 */
function getSortedImportText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  originalBlocks: ReadonlyArray<SortableImportBlock>,
  sortedBlocks: ReadonlyArray<SortableImportBlock>,
): string {
  const separators = originalBlocks
    .slice(1)
    .map(getImportSeparator.bind(undefined, sourceCode, originalBlocks));
  return sortedBlocks.map(getSortedImportTextSegment.bind(undefined, separators)).join('');
}

/**
 * Returns one sorted declaration segment using its positional separator.
 *
 * @param separators - Original whitespace separators.
 * @param block - Sorted import block.
 * @param index - Sorted position.
 * @returns Segment text.
 */
function getSortedImportTextSegment(
  separators: ReadonlyArray<string>,
  block: Readonly<SortableImportBlock>,
  index: number,
): string {
  return index === 0 ? block.text : `${separators[index - 1]}${block.text}`;
}

/**
 * Returns true when at least two imports exist.
 *
 * @param imports - Collected imports.
 * @returns True when ordering validation should run.
 */
function hasAtLeastTwoImports(imports: readonly ImportEntry[]): boolean {
  return imports.length >= MIN_IMPORTS_TO_VALIDATE;
}

/**
 * Returns true when sorting keeps every explicit side-effect import at its original index.
 *
 * @param originalBlocks - Blocks in source order.
 * @param sortedBlocks - Blocks in proposed sorted order.
 * @returns True when no side-effect import changes position.
 */
function hasPreservedSideEffectPositions(
  originalBlocks: ReadonlyArray<SortableImportBlock>,
  sortedBlocks: ReadonlyArray<SortableImportBlock>,
): boolean {
  return originalBlocks.every(isSideEffectPositionPreserved.bind(undefined, sortedBlocks));
}

/**
 * Returns true when comments or executable code occur between collected imports.
 *
 * @param sourceCode - ESLint source code helper.
 * @param blocks - Import blocks in source order.
 * @returns True when a whole-span fix would risk moving non-import content.
 */
function hasUnsafeInterImportContent(
  sourceCode: Readonly<TSESLint.SourceCode>,
  blocks: ReadonlyArray<SortableImportBlock>,
): boolean {
  return blocks
    .slice(1)
    .some(hasUnsafeInterImportContentAfterPrevious.bind(undefined, sourceCode, blocks));
}

/**
 * Returns true when one import separator contains non-whitespace content.
 *
 * @param sourceCode - ESLint source code helper.
 * @param blocks - Import blocks in source order.
 * @param block - Current import block.
 * @param index - Index after dropping the first block.
 * @returns True when the preceding separator is unsafe.
 */
function hasUnsafeInterImportContentAfterPrevious(
  sourceCode: Readonly<TSESLint.SourceCode>,
  blocks: ReadonlyArray<SortableImportBlock>,
  block: Readonly<SortableImportBlock>,
  index: number,
): boolean {
  const previousBlock = blocks[index];
  return sourceCode.text.slice(previousBlock.end, block.start).trim().length > 0;
}

/**
 * Inserts one import block into an immutable stable sorted collection.
 *
 * @param sortedBlocks - Blocks sorted so far.
 * @param block - Block to insert.
 * @returns Updated sorted blocks.
 */
function insertSortedImportBlock(
  sortedBlocks: ReadonlyArray<SortableImportBlock>,
  block: Readonly<SortableImportBlock>,
): ReadonlyArray<SortableImportBlock> {
  const insertionIndex = sortedBlocks.findIndex(isImportBlockAfter.bind(undefined, block));
  if (insertionIndex === -1) {
    return [...sortedBlocks, block];
  }
  return [...sortedBlocks.slice(0, insertionIndex), block, ...sortedBlocks.slice(insertionIndex)];
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
 * Returns true when an existing sorted block should follow the inserted block.
 *
 * @param block - Block being inserted.
 * @param sortedBlock - Existing sorted block.
 * @returns True when the insertion point is found.
 */
function isImportBlockAfter(
  block: Readonly<SortableImportBlock>,
  sortedBlock: Readonly<SortableImportBlock>,
): boolean {
  return compareImportEntries(block, sortedBlock) < 0;
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
 * Returns true when one side-effect import stays at its source index.
 *
 * @param sortedBlocks - Proposed sorted blocks.
 * @param block - Original import block.
 * @param index - Original index.
 * @returns True when the block is not side-effectful or has not moved.
 */
function isSideEffectPositionPreserved(
  sortedBlocks: ReadonlyArray<SortableImportBlock>,
  block: Readonly<SortableImportBlock>,
  index: number,
): boolean {
  return block.group !== ImportGroup.SideEffect || sortedBlocks[index].node === block.node;
}

/**
 * Reports alphabetical inversions for imports within the same group.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 * @param reportedNodes - Nodes already reported.
 * @param sourceCode - ESLint source code helper.
 */
function reportAlphabeticalViolations(
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
): void {
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
function reportBackwardGroupViolations(
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
): void {
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
function reportForwardGroupViolations(
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
): void {
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
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
  previousEntry: Readonly<ImportEntry>,
  currentEntry: Readonly<ImportEntry>,
): void {
  if (shouldSkipAlphabeticalComparison(state, previousEntry, currentEntry)) {
    return;
  }
  if (currentEntry.valueLower >= previousEntry.valueLower) {
    return;
  }
  reportUnsortedImportViolation(context, state, previousEntry, currentEntry);
  Reflect.apply(Set.prototype.add, state.reportedNodes, [currentEntry.node]);
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
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
  previousEntry: Readonly<ImportEntry>,
  currentEntry: Readonly<ImportEntry>,
): void {
  context.report({
    node: currentEntry.node,
    messageId: 'unsortedImport',
    data: { current: currentEntry.value, previous: previousEntry.value },
    fix: buildSortFix(state),
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
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
  currentEntry: Readonly<ImportEntry>,
  nextEntry: Readonly<ImportEntry>,
): void {
  if (state.reportedNodes.has(currentEntry.node) || currentEntry.group <= nextEntry.group) {
    return;
  }
  reportWrongGroupAfterViolation(context, state, currentEntry, nextEntry);
  Reflect.apply(Set.prototype.add, state.reportedNodes, [currentEntry.node]);
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
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
  currentEntry: Readonly<ImportEntry>,
  nextEntry: Readonly<ImportEntry>,
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
    fix: buildSortFix(state),
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
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
  previousEntry: Readonly<ImportEntry>,
  currentEntry: Readonly<ImportEntry>,
): void {
  if (state.reportedNodes.has(currentEntry.node) || currentEntry.group >= previousEntry.group) {
    return;
  }
  reportWrongGroupViolation(context, state, previousEntry, currentEntry);
  Reflect.apply(Set.prototype.add, state.reportedNodes, [currentEntry.node]);
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
  context: Readonly<SortImportsContext>,
  state: Readonly<SortImportsState>,
  previousEntry: Readonly<ImportEntry>,
  currentEntry: Readonly<ImportEntry>,
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
    fix: buildSortFix(state),
  });
}

/**
 * Returns true when an adjacent pair should not be checked alphabetically.
 *
 * @param state - Shared sort state.
 * @param previousEntry - Previous import entry.
 * @param currentEntry - Current import entry.
 * @returns True for already reported, cross-group, or side-effect pairs.
 */
function shouldSkipAlphabeticalComparison(
  state: Readonly<SortImportsState>,
  previousEntry: Readonly<ImportEntry>,
  currentEntry: Readonly<ImportEntry>,
): boolean {
  return (
    state.reportedNodes.has(currentEntry.node) ||
    currentEntry.group !== previousEntry.group ||
    currentEntry.group === ImportGroup.SideEffect
  );
}

/**
 * Sorts all import declaration blocks in a single replacement.
 *
 * @param sourceCode - ESLint source code helper.
 * @param originalBlocks - Import blocks in source order.
 * @param sortedBlocks - Import blocks in sorted order.
 * @param fixer - ESLint fixer.
 * @returns ESLint text replacement fix.
 */
function sortImportBlocks(
  sourceCode: Readonly<TSESLint.SourceCode>,
  originalBlocks: ReadonlyArray<SortableImportBlock>,
  sortedBlocks: ReadonlyArray<SortableImportBlock>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const firstBlock = originalBlocks[0];
  const lastBlock = originalBlocks[originalBlocks.length - 1];
  const replacement = getSortedImportText(sourceCode, originalBlocks, sortedBlocks);
  return fixer.replaceTextRange([firstBlock.start, lastBlock.end], replacement);
}

/**
 * Validates import ordering and reports all violations.
 *
 * @param context - ESLint rule execution context.
 * @param imports - Collected imports.
 */
function validateImports(
  context: Readonly<SortImportsContext>,
  imports: readonly ImportEntry[],
): void {
  if (!hasAtLeastTwoImports(imports)) {
    Reflect.set(imports, 'length', 0);
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
  Reflect.set(imports, 'length', 0);
}

/** Enforces top-level import grouping and safe one-pass alphabetical ordering. */
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
