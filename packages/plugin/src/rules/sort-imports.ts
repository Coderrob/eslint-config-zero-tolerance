import { ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const GROUP_NAMES = ['external', 'parent', 'peer', 'index'] as const;

type ImportEntry = {
  node: TSESTree.ImportDeclaration;
  value: string;
  valueLower: string;
  group: number;
};

/**
 * Returns true when path targets parent directory imports.
 * @param importPath - The import path to check.
 * @returns True if the path targets a parent directory, false otherwise.
 */
function isParentImportPath(importPath: string): boolean {
  if (importPath === '..') {
    return true;
  }
  return importPath.startsWith('../');
}

/**
 * Returns true when path is current-directory index import.
 * @param importPath - The import path to check.
 * @returns True if the path is a current-directory index import, false otherwise.
 */
function isIndexImportPath(importPath: string): boolean {
  if (importPath === '.') {
    return true;
  }
  return /^\.\/index(\.\w+)?$/.test(importPath);
}

/**
 * Returns the group rank for an import path.
 * Groups are ordered: external (0) -> parent (1) -> peer (2) -> index (3).
 *
 * @param importPath Import source path from an `ImportDeclaration`.
 * @returns Numeric group rank used for ordering comparisons.
 * @throws Does not throw.
 */
function getImportGroup(importPath: string): number {
  return importPath.startsWith('.') ? getRelativeImportGroup(importPath) : 0;
}

/**
 * Returns group rank for relative import paths.
 * @param importPath - The relative import path to categorize.
 * @returns The group rank: 1 for parent imports, 3 for index imports, 2 for peer imports.
 */
function getRelativeImportGroup(importPath: string): number {
  if (isParentImportPath(importPath)) {
    return 1;
  }
  return isIndexImportPath(importPath) ? 3 : 2;
}

/** Enforces top-level import grouping and alphabetical ordering with adjacent-swap fixes. */
export const sortImports = createRule({
  name: 'sort-imports',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Require import declarations to be grouped (external -> parent -> peer -> index) and sorted alphabetically within each group',
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
  /**
   * Creates stateful visitors that validate import grouping and sorting.
   *
   * @param context ESLint rule execution context.
   * @returns Visitor map consumed by ESLint during traversal.
   * @throws Does not throw.
   */
  create(context) {
    const sourceCode = context.sourceCode;
    const imports: ImportEntry[] = [];

    /**
     * Returns true when two import nodes are consecutive in the collected imports array.
     * Only adjacent imports are safe to swap without disturbing in-between imports.
     *
     * @param a First import declaration node.
     * @param b Second import declaration node.
     * @returns True if a and b are adjacent, false otherwise.
     * @throws Does not throw.
     */
    const areAdjacent = (a: TSESTree.ImportDeclaration, b: TSESTree.ImportDeclaration): boolean => {
      const aIdx = imports.findIndex((e) => e.node === a);
      const bIdx = imports.findIndex((e) => e.node === b);
      return Math.abs(bIdx - aIdx) === 1;
    };

    /**
     * Builds a fixer that swaps two import declarations while preserving the
     * exact whitespace/newlines between them.
     *
     * @param previousImport Import currently before the misplaced import.
     * @param currentImport Import currently after the misplaced import.
     * @returns ESLint fixer callback that swaps two adjacent import blocks.
     * @throws Does not throw.
     */
    const getSwapFix = (
      previousImport: TSESTree.ImportDeclaration,
      currentImport: TSESTree.ImportDeclaration,
    ) => {
      return (fixer: TSESLint.RuleFixer) => {
        const previousText = sourceCode.getText(previousImport);
        const currentText = sourceCode.getText(currentImport);
        const betweenText = sourceCode.text.slice(previousImport.range[1], currentImport.range[0]);
        const replacement = `${currentText}${betweenText}${previousText}`;

        return fixer.replaceTextRange(
          [previousImport.range[0], currentImport.range[1]],
          replacement,
        );
      };
    };

    /**
     * Stores each import declaration with normalized metadata used by sorting passes.
     *
     * @param node Import declaration currently visited.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const collectImport = (node: TSESTree.ImportDeclaration): void => {
      const value = node.source.value;
      imports.push({
        node,
        value,
        valueLower: value.toLowerCase(),
        group: getImportGroup(value),
      });
    };

    /**
     * Reports an import that appears before a higher-priority group.
     *
     * @param entry Current import violating forward group ordering.
     * @param highestEntry Highest-ranked import observed so far.
     * @param reportedNodes Set used to prevent duplicate reports per node.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const reportWrongGroup = (
      entry: ImportEntry,
      highestEntry: ImportEntry,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): void => {
      context.report({
        node: entry.node,
        messageId: 'wrongGroup',
        data: {
          current: entry.value,
          previous: highestEntry.value,
          currentGroup: GROUP_NAMES[entry.group],
          previousGroup: GROUP_NAMES[highestEntry.group],
        },
        ...(areAdjacent(highestEntry.node, entry.node)
          ? { fix: getSwapFix(highestEntry.node, entry.node) }
          : {}),
      });
      reportedNodes.add(entry.node);
    };

    /**
     * Reports an import that appears after a lower-priority group when scanning backward.
     *
     * @param entry Current import violating backward group ordering.
     * @param lowestEntry Lowest-ranked import observed from the end of the file.
     * @param reportedNodes Set used to prevent duplicate reports per node.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const reportWrongGroupAfter = (
      entry: ImportEntry,
      lowestEntry: ImportEntry,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): void => {
      context.report({
        node: entry.node,
        messageId: 'wrongGroupAfter',
        data: {
          current: entry.value,
          next: lowestEntry.value,
          currentGroup: GROUP_NAMES[entry.group],
          nextGroup: GROUP_NAMES[lowestEntry.group],
        },
        ...(areAdjacent(entry.node, lowestEntry.node)
          ? { fix: getSwapFix(entry.node, lowestEntry.node) }
          : {}),
      });
      reportedNodes.add(entry.node);
    };

    /**
     * Reports alphabetical inversions within a single group.
     *
     * @param entry Current import that should appear earlier.
     * @param existing Prior import that should appear later.
     * @param reportedNodes Set used to prevent duplicate reports per node.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const reportUnsortedImport = (
      entry: ImportEntry,
      existing: ImportEntry,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): void => {
      context.report({
        node: entry.node,
        messageId: 'unsortedImport',
        data: { current: entry.value, previous: existing.value },
        ...(areAdjacent(existing.node, entry.node)
          ? { fix: getSwapFix(existing.node, entry.node) }
          : {}),
      });
      reportedNodes.add(entry.node);
    };

    /**
     * Forward pass that finds imports placed too early relative to group priority.
     *
     * @param reportedNodes Set used to prevent duplicate reports per node.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const runForwardGroupPass = (reportedNodes: Set<TSESTree.ImportDeclaration>): void => {
      let highestEntry: ImportEntry | null = null;
      for (const entry of imports) {
        const violationAnchor = getForwardViolationAnchor(entry, highestEntry, reportedNodes);
        if (violationAnchor !== null) {
          reportWrongGroup(entry, violationAnchor, reportedNodes);
        }

        highestEntry = pickHighestEntry(entry, highestEntry);
      }
    };

    /**
     * Backward pass that finds imports placed too late relative to group priority.
     *
     * @param reportedNodes Set used to prevent duplicate reports per node.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const runBackwardGroupPass = (reportedNodes: Set<TSESTree.ImportDeclaration>): void => {
      let lowestEntry: ImportEntry | null = null;
      for (let i = imports.length - 1; i >= 0; i--) {
        const entry = imports[i];

        const violationAnchor = getBackwardViolationAnchor(entry, lowestEntry, reportedNodes);
        if (violationAnchor !== null) {
          reportWrongGroupAfter(entry, violationAnchor, reportedNodes);
        }

        lowestEntry = pickLowestEntry(entry, lowestEntry);
      }
    };

    /**
     * Final per-group alphabetical pass for nodes not already reported by group checks.
     *
     * @param reportedNodes Set used to prevent duplicate reports per node.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const runAlphabeticalPass = (reportedNodes: Set<TSESTree.ImportDeclaration>): void => {
      const highestByGroup = new Map<number, ImportEntry>();
      for (const entry of imports) {
        processAlphabeticalEntry(entry, highestByGroup, reportedNodes);
      }
    };

    /**
     * Processes one import entry during alphabetical validation.
     * @param entry - The import entry to process.
     * @param highestByGroup - Map tracking the highest entry per group.
     * @param reportedNodes - Set of nodes that have already been reported.
     * @returns Nothing.
     */
    const processAlphabeticalEntry = (
      entry: ImportEntry,
      highestByGroup: Map<number, ImportEntry>,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): void => {
      if (reportedNodes.has(entry.node)) {
        return;
      }
      const existing = highestByGroup.get(entry.group);
      if (isAlphabeticalViolation(entry, existing)) {
        reportUnsortedImport(entry, existing, reportedNodes);
        return;
      }
      trackHighestInGroup(entry, existing, highestByGroup);
    };

    /**
     * Returns higher-group anchor violated by current entry, or null.
     * @param entry - The current import entry.
     * @param highestEntry - The highest-ranked entry observed so far.
     * @param reportedNodes - Set of nodes that have already been reported.
     * @returns The violating anchor entry, or null if no violation.
     */
    const getForwardViolationAnchor = (
      entry: ImportEntry,
      highestEntry: ImportEntry | null,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): ImportEntry | null => {
      if (!canCheckForwardViolation(entry, highestEntry, reportedNodes)) {
        return null;
      }
      return entry.group < highestEntry.group ? highestEntry : null;
    };

    /**
     * Returns next highest entry marker used by forward pass.
     * @param entry - The current import entry.
     * @param highestEntry - The current highest entry.
     * @returns The new highest entry.
     */
    const pickHighestEntry = (
      entry: ImportEntry,
      highestEntry: ImportEntry | null,
    ): ImportEntry => {
      if (highestEntry === null || entry.group >= highestEntry.group) {
        return entry;
      }
      return highestEntry;
    };

    /**
     * Returns lower-group anchor violated by current entry, or null.
     * @param entry - The current import entry.
     * @param lowestEntry - The lowest-ranked entry observed from the end.
     * @param reportedNodes - Set of nodes that have already been reported.
     * @returns The violating anchor entry, or null if no violation.
     */
    const getBackwardViolationAnchor = (
      entry: ImportEntry,
      lowestEntry: ImportEntry | null,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): ImportEntry | null => {
      if (!canCheckBackwardViolation(entry, lowestEntry, reportedNodes)) {
        return null;
      }
      return entry.group > lowestEntry.group ? lowestEntry : null;
    };

    /**
     * Returns next lowest entry marker used by backward pass.
     * @param entry - The current import entry.
     * @param lowestEntry - The current lowest entry.
     * @returns The new lowest entry.
     */
    const pickLowestEntry = (entry: ImportEntry, lowestEntry: ImportEntry | null): ImportEntry => {
      if (lowestEntry === null || entry.group <= lowestEntry.group) {
        return entry;
      }
      return lowestEntry;
    };

    /**
     * Returns true when current import should appear before existing one in same group.
     * @param entry - The current import entry.
     * @param existing - The existing import entry in the same group.
     * @returns True if there's an alphabetical violation, false otherwise.
     */
    const isAlphabeticalViolation = (
      entry: ImportEntry,
      existing: ImportEntry | undefined,
    ): existing is ImportEntry => {
      if (existing === undefined) {
        return false;
      }
      return entry.valueLower < existing.valueLower;
    };

    /**
     * Returns true when entry should become current max lexical import for its group.
     * @param entry - The current import entry.
     * @param existing - The existing highest entry in the group.
     * @returns True if the entry should be tracked as highest, false otherwise.
     */
    const shouldTrackAsHighestInGroup = (
      entry: ImportEntry,
      existing: ImportEntry | undefined,
    ): boolean => {
      if (existing === undefined) {
        return true;
      }
      return entry.valueLower > existing.valueLower;
    };

    /**
     * Updates highest-by-group tracker when current entry becomes the new max.
     * @param entry - The current import entry.
     * @param existing - The existing highest entry in the group.
     * @param highestByGroup - Map tracking the highest entry per group.
     * @returns Nothing.
     */
    const trackHighestInGroup = (
      entry: ImportEntry,
      existing: ImportEntry | undefined,
      highestByGroup: Map<number, ImportEntry>,
    ): void => {
      if (shouldTrackAsHighestInGroup(entry, existing)) {
        highestByGroup.set(entry.group, entry);
      }
    };

    /**
     * Returns true when forward violation comparison can be evaluated safely.
     * @param entry - The current import entry.
     * @param highestEntry - The highest-ranked entry observed so far.
     * @param reportedNodes - Set of nodes that have already been reported.
     * @returns True if forward violation can be checked, false otherwise.
     */
    const canCheckForwardViolation = (
      entry: ImportEntry,
      highestEntry: ImportEntry | null,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): highestEntry is ImportEntry => {
      if (highestEntry === null) {
        return false;
      }
      return !reportedNodes.has(entry.node);
    };

    /**
     * Returns true when backward violation comparison can be evaluated safely.
     * @param entry - The current import entry.
     * @param lowestEntry - The lowest-ranked entry observed from the end.
     * @param reportedNodes - Set of nodes that have already been reported.
     * @returns True if backward violation can be checked, false otherwise.
     */
    const canCheckBackwardViolation = (
      entry: ImportEntry,
      lowestEntry: ImportEntry | null,
      reportedNodes: Set<TSESTree.ImportDeclaration>,
    ): lowestEntry is ImportEntry => {
      if (lowestEntry === null) {
        return false;
      }
      return !reportedNodes.has(entry.node);
    };

    return {
      ImportDeclaration: collectImport,
      /**
       * Executes import validation passes after all imports in the file are collected.
       *
       * @returns Nothing.
       * @throws Does not throw.
       */
      'Program:exit'() {
        if (imports.length < 2) {
          imports.length = 0;
          return;
        }

        const reportedNodes = new Set<TSESTree.ImportDeclaration>();

        // Forward pass: report imports that appear too early relative to a
        // previously seen higher-ranked group.
        runForwardGroupPass(reportedNodes);

        // Backward pass: report imports that appear too late relative to a
        // lower-ranked group that should come before them.
        runBackwardGroupPass(reportedNodes);

        // Within each group, report case-insensitive alphabetical inversions
        // for nodes not already reported by group-order checks.
        runAlphabeticalPass(reportedNodes);

        imports.length = 0;
      },
    };
  },
});

export default sortImports;
