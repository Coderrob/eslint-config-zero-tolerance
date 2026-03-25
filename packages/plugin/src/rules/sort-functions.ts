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
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createRule } from '../rule-factory';

const CONST_VARIABLE_KIND = 'const';

enum CommentType {
  Block = 'Block',
  Line = 'Line',
}

type SortableFunctionNode = TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator;
type SortableFunction = Readonly<{
  name: string;
  node: SortableFunctionNode;
}>;
type SortableBlock = Readonly<{
  end: number;
  start: number;
  text: string;
}>;
type LeadingCommentScanState = Readonly<{
  nextStart: number;
  nextStartLine: number;
  startIndex: number;
}>;
type SortFunctionsContext = Readonly<TSESLint.RuleContext<'unsortedFunction', []>>;
type SortableFunctions = SortableFunction[];

/**
 * Builds a sortable block from a declaration and its owned comments.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Declaration node.
 * @param leadingComments - Owned leading comments.
 * @param trailingComments - Owned trailing comments.
 * @returns Sortable text block.
 */
function buildSortableBlock(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
  leadingComments: ReadonlyArray<TSESTree.Comment>,
  trailingComments: ReadonlyArray<TSESTree.Comment>,
): SortableBlock {
  const start = getSortableBlockStart(node, leadingComments);
  const end = getSortableBlockEnd(node, trailingComments);
  return { start, end, text: sourceCode.text.slice(start, end) };
}

/**
 * Checks the collected functions for alphabetical ordering.
 *
 * @param context - ESLint rule execution context.
 * @param functions - Function declarations in source order.
 * @param sourceCode - ESLint source code helper.
 */
function checkFunctionOrdering(
  context: SortFunctionsContext,
  functions: SortableFunctions,
  sourceCode: Readonly<TSESLint.SourceCode>,
): void {
  for (let index = 1; index < functions.length; index += 1) {
    const previousFunction = functions[index - 1];
    const currentFunction = functions[index];
    if (currentFunction.name.toLowerCase() < previousFunction.name.toLowerCase()) {
      reportUnsortedFunction(context, sourceCode, previousFunction, currentFunction);
    }
  }
}

/**
 * Collects adjacent owned trailing comments after the first same-line comment.
 *
 * @param sourceCode - ESLint source code helper.
 * @param trailingComments - Comments that follow the declaration.
 * @param startIndex - Index of the first owned trailing comment.
 * @param nodeEndLine - Ending line of the declaration node.
 * @returns Owned trailing comments that move with the declaration.
 */
function collectAdjacentTrailingComments(
  sourceCode: Readonly<TSESLint.SourceCode>,
  trailingComments: ReadonlyArray<TSESTree.Comment>,
  startIndex: number,
  nodeEndLine: number,
): ReadonlyArray<TSESTree.Comment> {
  const owned = [trailingComments[startIndex]];
  for (let index = startIndex + 1; index < trailingComments.length; index += 1) {
    const current = trailingComments[index];
    const previous = owned[owned.length - 1];
    if (!isAdjacentTrailingComment(sourceCode, previous, current, nodeEndLine)) {
      break;
    }
    owned.push(current);
  }
  return owned;
}

/**
 * Collects function-valued variable declarators into sortable list.
 *
 * @param functions - Mutable sortable collection.
 * @param declarations - Variable declarators to inspect.
 */
function collectFunctionDeclarators(
  functions: SortableFunctions,
  declarations: TSESTree.VariableDeclarator[],
): void {
  for (const declaration of declarations) {
    const functionName = getFunctionDeclaratorName(declaration);
    if (functionName !== null) {
      functions.push({ name: functionName, node: declaration });
    }
  }
}

/**
 * Collects owned leading comments by walking backward through adjacent comments.
 *
 * @param sourceCode - ESLint source code helper.
 * @param leadingComments - Comments that precede the declaration.
 * @param startIndex - Index of the closest preceding comment to inspect.
 * @param nextStart - Start offset of the following owned span.
 * @param nextStartLine - Start line of the following owned span.
 * @returns Leading comments that should move with the declaration.
 */
function collectOwnedLeadingComments(
  sourceCode: Readonly<TSESLint.SourceCode>,
  leadingComments: ReadonlyArray<TSESTree.Comment>,
  scanState: LeadingCommentScanState,
): ReadonlyArray<TSESTree.Comment> {
  const ownedComments: TSESTree.Comment[] = [];
  let currentScanState = scanState;
  while (hasOwnedLeadingComment(sourceCode, leadingComments, currentScanState)) {
    const previousComment = leadingComments[currentScanState.startIndex];
    ownedComments.push(previousComment);
    currentScanState = updateLeadingCommentScanState(currentScanState, previousComment);
  }
  ownedComments.reverse();
  return ownedComments;
}

/**
 * Creates listeners for sort-functions rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createSortFunctionsListeners(context: SortFunctionsContext): TSESLint.RuleListener {
  const functions: SortableFunctions = [];
  const sourceCode = context.sourceCode;
  return {
    FunctionDeclaration: processFunctionDeclaration.bind(undefined, functions),
    VariableDeclaration: processVariableDeclaration.bind(undefined, functions),
    'Program:exit': checkFunctionOrdering.bind(undefined, context, functions, sourceCode),
  };
}

/**
 * Returns fixer callback that swaps two function declarations while preserving spacing.
 *
 * @param sourceCode - ESLint source code helper.
 * @param previousFunction - Previous sortable function.
 * @param currentFunction - Current sortable function.
 * @returns Fix callback, or null when swap is not safe.
 */
function createSwapFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousFunction: SortableFunction,
  currentFunction: SortableFunction,
): TSESLint.ReportFixFunction | null {
  const sortableBlocks = getSortableBlocks(sourceCode, previousFunction, currentFunction);
  if (sortableBlocks === null) {
    return null;
  }
  const [previousBlock, currentBlock] = sortableBlocks;
  if (hasCommentBetweenBlocks(sourceCode, previousBlock, currentBlock)) {
    return null;
  }
  return swapSortableFunctionBlocks.bind(undefined, sourceCode, previousBlock, currentBlock);
}

/**
 * Returns a function declaration name for sortable top-level declarations.
 *
 * @param declaration - Function declaration node.
 * @returns Function name, or an empty string when no identifier is present.
 */
function getFunctionDeclarationName(declaration: TSESTree.FunctionDeclaration): string {
  return declaration.id?.name ?? '';
}

/**
 * Returns declarator identifier name when declaration is function-valued.
 *
 * @param declaration - The variable declarator to inspect.
 * @returns The identifier name if declaration is function-valued, otherwise null.
 */
function getFunctionDeclaratorName(declaration: TSESTree.VariableDeclarator): string | null {
  if (!isFunctionDeclarator(declaration)) {
    return null;
  }
  return declaration.id.name;
}

/**
 * Returns owned leading comments for a declaration block.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node to inspect.
 * @returns Leading comments that should move with the declaration.
 */
function getOwnedLeadingComments(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): ReadonlyArray<TSESTree.Comment> {
  const leadingComments = sourceCode.getCommentsBefore(node);
  return collectOwnedLeadingComments(
    sourceCode,
    leadingComments,
    {
      nextStart: node.range[0],
      nextStartLine: node.loc.start.line,
      startIndex: leadingComments.length - 1,
    },
  );
}

/**
 * Returns owned trailing comments for a declaration block.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node to inspect.
 * @returns Same-line trailing comments that should move with the declaration.
 */
function getOwnedTrailingComments(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): ReadonlyArray<TSESTree.Comment> {
  const trailingComments = sourceCode.getCommentsAfter(node);
  const firstOwnedIndex = getOwnedTrailingCommentStartIndex(sourceCode, node, trailingComments);
  if (firstOwnedIndex === null) {
    return [];
  }
  return collectAdjacentTrailingComments(
    sourceCode,
    trailingComments,
    firstOwnedIndex,
    node.loc.end.line,
  );
}

/**
 * Returns the first same-line trailing comment index owned by a declaration.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node that may own trailing comments.
 * @param trailingComments - Comments that follow the declaration.
 * @returns First owned trailing comment index, or null when none exist.
 */
function getOwnedTrailingCommentStartIndex(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
  trailingComments: ReadonlyArray<TSESTree.Comment>,
): number | null {
  for (let index = 0; index < trailingComments.length; index += 1) {
    if (isOwnedTrailingComment(sourceCode, node, trailingComments[index])) {
      return index;
    }
  }
  return null;
}

/**
 * Returns the sortable text block for a swappable declaration, including owned comments.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Swappable declaration node.
 * @returns Sortable text block, or null when comment ownership is unsafe.
 */
function getSortableBlock(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): SortableBlock | null {
  const leadingComments = getOwnedLeadingComments(sourceCode, node);
  const trailingComments = getOwnedTrailingComments(sourceCode, node);
  if (hasUnsafeOwnedComments(leadingComments, trailingComments)) {
    return null;
  }
  return buildSortableBlock(sourceCode, node, leadingComments, trailingComments);
}

/**
 * Returns the end offset for a sortable declaration block.
 *
 * @param node - Declaration node.
 * @param trailingComments - Owned trailing comments.
 * @returns End offset for the block.
 */
function getSortableBlockEnd(
  node: TSESTree.Node,
  trailingComments: ReadonlyArray<TSESTree.Comment>,
): number {
  return trailingComments.at(-1)?.range[1] ?? node.range[1];
}

/**
 * Returns swappable comment-aware blocks for two sortable functions.
 *
 * @param sourceCode - ESLint source code helper.
 * @param previousFunction - Previous sortable function.
 * @param currentFunction - Current sortable function.
 * @returns Pair of sortable blocks, or null when swap ownership is unsafe.
 */
function getSortableBlocks(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousFunction: SortableFunction,
  currentFunction: SortableFunction,
): readonly [SortableBlock, SortableBlock] | null {
  const previousBlock = getSwappableBlock(sourceCode, previousFunction);
  const currentBlock = getSwappableBlock(sourceCode, currentFunction);
  return previousBlock === null || currentBlock === null ? null : [previousBlock, currentBlock];
}

/**
 * Returns the start offset for a sortable declaration block.
 *
 * @param node - Declaration node.
 * @param leadingComments - Owned leading comments.
 * @returns Start offset for the block.
 */
function getSortableBlockStart(
  node: TSESTree.Node,
  leadingComments: ReadonlyArray<TSESTree.Comment>,
): number {
  return leadingComments.at(0)?.range[0] ?? node.range[0];
}

/**
 * Returns the swappable text block for one sortable function.
 *
 * @param sourceCode - ESLint source code helper.
 * @param sortableFunction - Sortable function metadata.
 * @returns Sortable block, or null when the function cannot be swapped safely.
 */
function getSwappableBlock(
  sourceCode: Readonly<TSESLint.SourceCode>,
  sortableFunction: SortableFunction,
): SortableBlock | null {
  const swappableNode = getSwappableNode(sortableFunction.node);
  return swappableNode === null ? null : getSortableBlock(sourceCode, swappableNode);
}

/**
 * Returns node to swap for fix operations, or null when safe swap is not possible.
 *
 * @param node - Sortable function node.
 * @returns Swappable node.
 */
function getSwappableNode(node: SortableFunctionNode): TSESTree.Node | null {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    return getTopLevelStatementNode(node);
  }
  return getVariableDeclaratorStatementNode(node);
}

/**
 * Returns top-level statement node for a function declaration.
 *
 * @param node - Function declaration node.
 * @returns Swappable statement node.
 */
function getTopLevelStatementNode(node: TSESTree.FunctionDeclaration): TSESTree.Node {
  return node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ? node.parent : node;
}

/**
 * Returns swappable statement node for a variable declarator, if unambiguous.
 *
 * @param node - Variable declarator node.
 * @returns Swappable statement node, or null.
 */
function getVariableDeclaratorStatementNode(
  node: TSESTree.VariableDeclarator,
): TSESTree.Node | null {
  const declaration = node.parent;
  if (declaration.declarations.length !== 1) {
    return null;
  }
  return declaration.parent.type === AST_NODE_TYPES.ExportNamedDeclaration
    ? declaration.parent
    : declaration;
}

/**
 * Returns true when preceding adjacent content makes a leading comment ambiguous.
 *
 * @param sourceCode - ESLint source code helper.
 * @param comment - Candidate leading comment.
 * @returns True when nearby previous content means the comment should not move.
 */
function hasAdjacentPreviousNonLeadingContent(
  sourceCode: Readonly<TSESLint.SourceCode>,
  comment: TSESTree.Comment,
): boolean {
  const previousTokenOrComment = sourceCode.getTokenBefore(comment, { includeComments: true });
  if (previousTokenOrComment === null) {
    return false;
  }
  return (
    comment.loc.start.line - previousTokenOrComment.loc.end.line <= 1 &&
    isPreviousNonLeadingContent(sourceCode, previousTokenOrComment)
  );
}

/**
 * Returns true when non-whitespace text between declaration blocks contains comments.
 *
 * @param sourceCode - ESLint source code helper.
 * @param previousBlock - Earlier sortable block.
 * @param currentBlock - Later sortable block.
 * @returns True when inter-block text contains comments.
 */
function hasCommentBetweenBlocks(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousBlock: SortableBlock,
  currentBlock: SortableBlock,
): boolean {
  const betweenText = sourceCode.text.slice(previousBlock.end, currentBlock.start);
  return betweenText.includes('//') || betweenText.includes('/*');
}

/**
 * Returns true when comment text contains directive-style markers that must not move.
 *
 * @param comments - Comments to inspect.
 * @returns True when any comment likely affects linting or compilation behavior.
 */
function hasDirectiveComment(comments: ReadonlyArray<TSESTree.Comment>): boolean {
  for (const comment of comments) {
    if (isDirectiveComment(comment)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when only indentation appears before a comment on its line.
 *
 * @param sourceCode - ESLint source code helper.
 * @param comment - Candidate comment.
 * @returns True when the comment starts on its own line.
 */
function hasOnlyWhitespaceBeforeComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  comment: TSESTree.Comment,
): boolean {
  const lineText = sourceCode.lines[comment.loc.start.line - 1] ?? '';
  return lineText.slice(0, comment.loc.start.column).trim().length === 0;
}

/**
 * Checks whether the current leading comment scan points at an owned comment.
 *
 * @param sourceCode - ESLint source code helper.
 * @param leadingComments - Comments that precede the declaration.
 * @param scanState - Current leading comment scan state.
 * @returns True when the indexed comment is attached to the owned span.
 */
function hasOwnedLeadingComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  leadingComments: ReadonlyArray<TSESTree.Comment>,
  scanState: LeadingCommentScanState,
): boolean {
  return scanState.startIndex >= 0
    && isAttachedLeadingComment(
      sourceCode,
      leadingComments[scanState.startIndex],
      scanState.nextStart,
      scanState.nextStartLine,
    );
}

/**
 * Returns true when owned comments make block extraction unsafe.
 *
 * @param leadingComments - Owned leading comments.
 * @param trailingComments - Owned trailing comments.
 * @returns True when directive comments are present.
 */
function hasUnsafeOwnedComments(
  leadingComments: ReadonlyArray<TSESTree.Comment>,
  trailingComments: ReadonlyArray<TSESTree.Comment>,
): boolean {
  return hasDirectiveComment(leadingComments) || hasDirectiveComment(trailingComments);
}

/**
 * Returns true when a trailing comment is adjacent to the previous owned comment.
 *
 * @param sourceCode - ESLint source code helper.
 * @param previousComment - Previously owned trailing comment.
 * @param currentComment - Candidate trailing comment.
 * @param nodeEndLine - Ending line of the declaration node.
 * @returns True when the candidate comment should move with the declaration.
 */
function isAdjacentTrailingComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousComment: TSESTree.Comment,
  currentComment: TSESTree.Comment,
  nodeEndLine: number,
): boolean {
  return (
    currentComment.loc.start.line === nodeEndLine &&
    !/[^\s]/u.test(sourceCode.text.slice(previousComment.range[1], currentComment.range[0]))
  );
}

/**
 * Returns true when a comment is attached to the following node with no blank-line break.
 *
 * @param sourceCode - ESLint source code helper.
 * @param comment - Candidate comment.
 * @param nextStart - Start offset of the following owned span.
 * @param nextStartLine - Start line of the following owned span.
 * @returns True when the comment should move with the following declaration.
 */
function isAttachedLeadingComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  comment: TSESTree.Comment,
  nextStart: number,
  nextStartLine: number,
): boolean {
  return (
    isOwnLineBlockComment(sourceCode, comment) &&
    !hasAdjacentPreviousNonLeadingContent(sourceCode, comment) &&
    nextStartLine - comment.loc.end.line <= 1 &&
    sourceCode.text.slice(comment.range[1], nextStart).trim().length === 0
  );
}

/**
 * Returns true when a comment is a block comment token.
 *
 * @param comment - Candidate comment.
 * @returns True when comment.type is Block.
 */
function isBlockComment(comment: TSESTree.Comment): boolean {
  return isCommentType(comment.type, CommentType.Block);
}

/**
 * Returns true when a token-like node is a comment.
 *
 * @param tokenOrComment - Token-like node to inspect.
 * @returns True when the node is a line or block comment.
 */
function isCommentToken(
  tokenOrComment: TSESTree.Comment | TSESTree.Token,
): tokenOrComment is TSESTree.Comment {
  return (
    isCommentType(tokenOrComment.type, CommentType.Block) ||
    isCommentType(tokenOrComment.type, CommentType.Line)
  );
}

/**
 * Returns true when a token type matches a tracked comment kind.
 *
 * @param type - Token type string from the parser.
 * @param commentType - Comment kind to compare.
 * @returns True when the token type matches the comment kind.
 */
function isCommentType(type: string, commentType: CommentType): boolean {
  return type === commentType;
}

/**
 * Returns true when a comment likely acts as a directive.
 *
 * @param comment - Comment to inspect.
 * @returns True when comment content should not be moved.
 */
function isDirectiveComment(comment: TSESTree.Comment): boolean {
  return /eslint-(disable|enable)|@ts-(ignore|expect-error|nocheck|check)|istanbul ignore/iu.test(
    comment.value,
  );
}

/**
 * Checks if a variable declarator contains a function expression or arrow function.
 *
 * @param declaration - The variable declarator to check.
 * @returns True if the declarator initializes a function.
 */
function isFunctionDeclarator(
  declaration: TSESTree.VariableDeclarator,
): declaration is TSESTree.VariableDeclarator & {
  id: TSESTree.Identifier;
  init: TSESTree.Expression;
} {
  if (declaration.id.type !== AST_NODE_TYPES.Identifier || declaration.init === null) {
    return false;
  }
  return isFunctionInitializer(declaration.init);
}

/**
 * Returns true when initializer node is function-valued.
 *
 * @param init - The expression node to check.
 * @returns True if the expression is a function, false otherwise.
 */
function isFunctionInitializer(init: TSESTree.Expression): boolean {
  return (
    init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    init.type === AST_NODE_TYPES.FunctionExpression
  );
}

/**
 * Returns true when a comment is a same-line trailing comment owned by the node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node that may own the comment.
 * @param comment - Candidate trailing comment.
 * @returns True when the comment should move with the node.
 */
function isOwnedTrailingComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
  comment: TSESTree.Comment | undefined,
): comment is TSESTree.Comment {
  return (
    comment !== undefined &&
    comment.loc.start.line === node.loc.end.line &&
    sourceCode.text.slice(node.range[1], comment.range[0]).trim().length === 0
  );
}

/**
 * Returns true when a comment is a block comment that starts on its own line.
 *
 * @param sourceCode - ESLint source code helper.
 * @param comment - Candidate comment.
 * @returns True when the comment can be treated as an owned leading block.
 */
function isOwnLineBlockComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  comment: TSESTree.Comment,
): boolean {
  return isBlockComment(comment) && hasOnlyWhitespaceBeforeComment(sourceCode, comment);
}

/**
 * Returns true when previous adjacent content cannot belong to a leading comment block.
 *
 * @param sourceCode - ESLint source code helper.
 * @param tokenOrComment - Previous adjacent token or comment.
 * @returns True when the adjacent content makes ownership unsafe.
 */
function isPreviousNonLeadingContent(
  sourceCode: Readonly<TSESLint.SourceCode>,
  tokenOrComment: TSESTree.Comment | TSESTree.Token,
): boolean {
  return isCommentToken(tokenOrComment) ? !isOwnLineBlockComment(sourceCode, tokenOrComment) : true;
}

/**
 * Checks if a function declaration is at the top level (including exported declarations).
 *
 * @param node - The function declaration node to check.
 * @returns True if the declaration is at the top level.
 */
function isTopLevelFunctionDeclaration(node: TSESTree.FunctionDeclaration): boolean {
  return (
    node.parent.type === AST_NODE_TYPES.Program ||
    (node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      node.parent.parent.type === AST_NODE_TYPES.Program)
  );
}

/**
 * Checks if a variable declaration is at the top level (including exported declarations).
 *
 * @param node - The variable declaration node to check.
 * @returns True if the declaration is at the top level.
 */
function isTopLevelVariableDeclaration(node: TSESTree.VariableDeclaration): boolean {
  return (
    node.parent.type === AST_NODE_TYPES.Program ||
    (node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      node.parent.parent.type === AST_NODE_TYPES.Program)
  );
}

/**
 * Processes a function declaration node.
 *
 * @param functions - Mutable sortable collection.
 * @param node - The function declaration node.
 */
function processFunctionDeclaration(
  functions: SortableFunctions,
  node: TSESTree.FunctionDeclaration,
): void {
  if (!isTopLevelFunctionDeclaration(node)) {
    return;
  }
  functions.push({ name: getFunctionDeclarationName(node), node });
}

/**
 * Processes a variable declaration node.
 *
 * @param functions - Mutable sortable collection.
 * @param node - The variable declaration node.
 */
function processVariableDeclaration(
  functions: SortableFunctions,
  node: TSESTree.VariableDeclaration,
): void {
  if (node.kind !== CONST_VARIABLE_KIND || !isTopLevelVariableDeclaration(node)) {
    return;
  }
  collectFunctionDeclarators(functions, node.declarations);
}

/**
 * Reports one out-of-order function pair.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param previousFunction - Previous sortable function.
 * @param currentFunction - Current sortable function.
 */
function reportUnsortedFunction(
  context: SortFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousFunction: SortableFunction,
  currentFunction: SortableFunction,
): void {
  context.report({
    node: currentFunction.node,
    messageId: 'unsortedFunction',
    data: { current: currentFunction.name, previous: previousFunction.name },
    fix: createSwapFix(sourceCode, previousFunction, currentFunction),
  });
}

/**
 * Swaps two sortable function nodes while preserving text between them.
 *
 * @param sourceCode - ESLint source code helper.
 * @param previousNode - Previous node in source order.
 * @param currentNode - Current node in source order.
 * @param fixer - ESLint fixer.
 * @returns Text-range replacement fix.
 */
function swapSortableFunctionBlocks(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousBlock: SortableBlock,
  currentBlock: SortableBlock,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  const betweenText = sourceCode.text.slice(previousBlock.end, currentBlock.start);
  return fixer.replaceTextRange(
    [previousBlock.start, currentBlock.end],
    `${currentBlock.text}${betweenText}${previousBlock.text}`,
  );
}

/**
 * Advances the leading comment scan to the next earlier comment.
 *
 * @param scanState - Current leading comment scan state.
 * @param previousComment - Owned comment consumed by the scan.
 * @returns Updated scan state for the next iteration.
 */
function updateLeadingCommentScanState(
  scanState: LeadingCommentScanState,
  previousComment: TSESTree.Comment,
): LeadingCommentScanState {
  return {
    nextStart: previousComment.range[0],
    nextStartLine: previousComment.loc.start.line,
    startIndex: scanState.startIndex - 1,
  };
}

/** Enforces alphabetical ordering of top-level function declarations and function-valued consts. */
export const sortFunctions = createRule({
  name: 'sort-functions',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Require top-level functions to be sorted alphabetically',
    },
    messages: {
      unsortedFunction: 'Function "{{current}}" should come before "{{previous}}"',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createSortFunctionsListeners,
});

export default sortFunctions;
