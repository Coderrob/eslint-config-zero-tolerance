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
import { ANONYMOUS_FUNCTION_NAME } from '../constants';
import { type FunctionNode, isIdentifierNode, isTestFile } from '../helpers/ast-guards';
import {
  getFunctionDeclarationName,
  getFunctionVariableName,
  getIdentifierName,
} from '../helpers/ast-helpers';
import { hasDescendant } from '../helpers/ast/search';
import {
  getJsdocComment,
  getLineIndentation,
  getTargetNode,
  isStandaloneLineTarget,
} from '../helpers/jsdoc-helpers';
import { getNamedParameterName } from '../helpers/parameter-helpers';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

const COMMENT_PREFIX_LENGTH = 3;
const COMMENT_SUFFIX_LENGTH = 2;
const NESTED_CONTROL_FLOW_BOUNDARY_TYPES = new Set([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.ClassDeclaration,
  AST_NODE_TYPES.ClassExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);
const NAMED_KEY_PARENT_TYPES = new Set([
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.Property,
]);
const PARAM_DESCRIPTION_PLACEHOLDER = 'TODO: describe parameter';
const RETURNS_DESCRIPTION_PLACEHOLDER = 'TODO: describe return value';
const SUMMARY_DESCRIPTION_PLACEHOLDER = 'TODO: describe';
const THROWS_DESCRIPTION_PLACEHOLDER = 'TODO: describe error condition';

type NamedKeyParentNode =
  | TSESTree.MethodDefinition
  | TSESTree.PropertyDefinition
  | TSESTree.Property;

/**
 * Appends one line to a line accumulator.
 *
 * @param lines - Line accumulator.
 * @param line - Line to append.
 */
function appendLine(lines: readonly string[], line: string): void {
  Reflect.apply(Array.prototype.push, lines, [line]);
}

export enum RequireJsdocFunctionsMessageId {
  MissingJsdoc = 'missingJsdoc',
  MissingJsdocParam = 'missingJsdocParam',
  MissingJsdocReturns = 'missingJsdocReturns',
  MissingJsdocThrows = 'missingJsdocThrows',
}

enum JsdocTagName {
  Param = 'param',
  Return = 'return',
  Returns = 'returns',
  Throws = 'throws',
}

type RequireJsdocFunctionsContext = Readonly<
  TSESLint.RuleContext<RequireJsdocFunctionsMessageId, []>
>;

/**
 * Returns updated comment text with generated tag lines inserted before the closing marker.
 *
 * @param commentText - Existing JSDoc comment text.
 * @param tagLines - Missing tag lines without leading `*`.
 * @returns Updated JSDoc comment text.
 */
function appendTagLinesToComment(commentText: string, tagLines: ReadonlyArray<string>): string {
  const closingMatch = /\n([ \t]*)\*\/$/u.exec(commentText);
  if (closingMatch !== null) {
    return appendToMultilineComment(commentText, tagLines, closingMatch[1]);
  }
  return appendToSingleLineComment(commentText, tagLines);
}

/**
 * Returns multiline JSDoc text with new tags inserted before the closing line.
 *
 * @param commentText - Existing multiline JSDoc text.
 * @param tagLines - Missing tag lines without leading `*`.
 * @param indent - Closing-line indentation.
 * @returns Updated multiline JSDoc text.
 */
function appendToMultilineComment(
  commentText: string,
  tagLines: ReadonlyArray<string>,
  indent: string,
): string {
  let insertedTags = '';
  for (const tagLine of tagLines) {
    insertedTags += `\n${indent}* ${tagLine}`;
  }
  return commentText.replace(/\n([ \t]*)\*\/$/u, `${insertedTags}\n${indent}*/`);
}

/**
 * Returns single-line JSDoc converted to multiline form with appended tags.
 *
 * @param commentText - Existing single-line JSDoc text.
 * @param tagLines - Missing tag lines without leading `*`.
 * @returns Updated multiline JSDoc text.
 */
function appendToSingleLineComment(commentText: string, tagLines: ReadonlyArray<string>): string {
  const inlineDescription = commentText.slice(COMMENT_PREFIX_LENGTH, -COMMENT_SUFFIX_LENGTH).trim();
  const lines = ['/**'];
  if (inlineDescription.length > 0) {
    appendLine(lines, ` * ${inlineDescription}`);
  }
  for (const tagLine of tagLines) {
    appendLine(lines, ` * ${tagLine}`);
  }
  appendLine(lines, ' */');
  return lines.join('\n');
}

/**
 * Builds full JSDoc block text for insertion ahead of a function target node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param targetNode - Node that should receive the JSDoc comment.
 * @param node - Function node to document.
 * @returns JSDoc block text including trailing newline.
 */
function buildMissingJsdocBlock(
  sourceCode: Readonly<TSESLint.SourceCode>,
  targetNode: Readonly<TSESTree.Node>,
  node: Readonly<FunctionNode>,
): string {
  const indent = getLineIndentation(sourceCode, targetNode);
  const lines = [`${indent}/**`, `${indent} * ${getSummaryDescriptionLine(node)}`];
  const missingTagLines = getMissingTagLines(node, sourceCode, null);
  for (const tagLine of missingTagLines) {
    appendLine(lines, `${indent} * ${tagLine}`);
  }
  appendLine(lines, `${indent} */`);
  return `${lines.join('\n')}\n`;
}

/**
 * Creates fixer for functions missing a full JSDoc block.
 *
 * @param sourceCode - ESLint source code helper.
 * @param targetNode - Node that owns JSDoc placement.
 * @param node - Function node to document.
 * @param fixer - ESLint fixer helper.
 * @returns Rule fix that inserts generated JSDoc, or null when unsafe.
 */
function createMissingJsdocFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  targetNode: Readonly<TSESTree.Node>,
  node: Readonly<FunctionNode>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix | null {
  if (targetNode.type === AST_NODE_TYPES.VariableDeclarator) {
    return null;
  }
  if (!isStandaloneLineTarget(sourceCode, targetNode)) {
    return null;
  }
  const lineIndentation = getLineIndentation(sourceCode, targetNode);
  const insertIndex = targetNode.range[0] - lineIndentation.length;
  return fixer.insertTextBeforeRange(
    [insertIndex, insertIndex],
    buildMissingJsdocBlock(sourceCode, targetNode, node),
  );
}

/**
 * Creates fixer for functions with existing JSDoc missing required tags.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Function node being reported.
 * @param jsdocComment - Existing JSDoc block comment.
 * @param fixer - ESLint fixer helper.
 * @returns Rule fix that updates the existing JSDoc block with generated tags.
 */
function createMissingJsdocTagFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<FunctionNode>,
  jsdocComment: Readonly<TSESTree.Comment>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const missingTagLines = getMissingTagLines(node, sourceCode, jsdocComment);
  const commentText = sourceCode.getText(jsdocComment);
  const replacementText = appendTagLinesToComment(commentText, missingTagLines);
  return fixer.replaceText(jsdocComment, replacementText);
}

/**
 * Creates listeners for require-jsdoc-functions rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireJsdocFunctionsListeners(
  context: Readonly<RequireJsdocFunctionsContext>,
): TSESLint.RuleListener {
  if (isTestFile(context.filename)) {
    return {};
  }
  const sourceCode = context.sourceCode;
  return createFunctionNodeListeners(reportMissingJsdoc.bind(undefined, context, sourceCode));
}

/**
 * Returns a function name inferred from common declaration and assignment patterns.
 *
 * @param node - Function node to name.
 * @returns Inferred function name.
 */
function getFunctionName(node: Readonly<FunctionNode>): string {
  const names = [
    getFunctionDeclarationName(node),
    getFunctionVariableName(node),
    getNamedKeyFunctionName(node),
  ];
  for (const name of names) {
    if (name !== null) {
      return name;
    }
  }
  return ANONYMOUS_FUNCTION_NAME;
}

/**
 * Returns the number of `@param` tags present in a JSDoc comment.
 *
 * @param comment - JSDoc block comment.
 * @returns Number of parameter tags.
 */
function getJsdocParamTagCount(comment: Readonly<TSESTree.Comment>): number {
  const matches = comment.value.match(new RegExp(String.raw`@${JsdocTagName.Param}\b`, 'gu'));
  return matches === null ? 0 : matches.length;
}

/**
 * Returns expected `@param` tag names that are missing from JSDoc.
 *
 * @param node - Function node to inspect.
 * @param jsdocComment - Existing JSDoc block comment, or null.
 * @returns Missing parameter names in declaration order.
 */
function getMissingParamTagNames(
  node: Readonly<FunctionNode>,
  jsdocComment: TSESTree.Comment | null,
): ReadonlyArray<string> {
  const existingParamTags = jsdocComment === null ? 0 : getJsdocParamTagCount(jsdocComment);
  if (existingParamTags >= node.params.length) {
    return [];
  }
  return node.params.slice(existingParamTags).map(getParamTagNameAfterOffset.bind(undefined, existingParamTags));
}

/**
 * Returns JSDoc tag lines that are currently required and missing.
 *
 * @param node - Function node to inspect.
 * @param sourceCode - ESLint source code helper.
 * @param jsdocComment - Existing JSDoc block comment, or null.
 * @returns Missing JSDoc tag lines without leading `*`.
 */
function getMissingTagLines(
  node: Readonly<FunctionNode>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  jsdocComment: TSESTree.Comment | null,
): ReadonlyArray<string> {
  const missingTags: string[] = [];
  const missingParams = getMissingParamTagNames(node, jsdocComment);
  for (const name of missingParams) {
    appendLine(missingTags, `@${JsdocTagName.Param} ${name} ${PARAM_DESCRIPTION_PLACEHOLDER}`);
  }
  if (isMissingReturnsTag(node, sourceCode, jsdocComment)) {
    appendLine(missingTags, `@${JsdocTagName.Returns} ${RETURNS_DESCRIPTION_PLACEHOLDER}`);
  }
  if (isMissingThrowsTag(node, sourceCode, jsdocComment)) {
    appendLine(missingTags, `@${JsdocTagName.Throws} {Error} ${THROWS_DESCRIPTION_PLACEHOLDER}`);
  }
  return missingTags;
}

/**
 * Returns key name for method and property based function declarations.
 *
 * @param node - Function node to inspect.
 * @returns The key name if available, otherwise null.
 */
function getNamedKeyFunctionName(node: Readonly<FunctionNode>): string | null {
  if (!hasIdentifierKey(node.parent)) {
    return null;
  }
  return getIdentifierName(node.parent.key);
}

/**
 * Returns best-effort name for a function parameter tag.
 *
 * @param param - Parameter node.
 * @param position - One-based parameter position.
 * @returns Parameter name for generated JSDoc.
 */
function getParamTagName(param: Readonly<TSESTree.Parameter>, position: number): string {
  return getNamedParameterName(param) ?? `param${position}`;
}

/**
 * Returns a generated JSDoc parameter name after an existing tag offset.
 *
 * @param offset - Existing param tag count.
 * @param param - Parameter node.
 * @param index - Zero-based missing parameter index.
 * @returns Parameter name for generated JSDoc.
 */
function getParamTagNameAfterOffset(
  offset: number,
  param: Readonly<TSESTree.Parameter>,
  index: number,
): string {
  return getParamTagName(param, offset + index + 1);
}

/**
 * Returns a one-line summary sentence for generated JSDoc blocks.
 *
 * @param node - Function node to describe.
 * @returns Summary sentence text.
 */
function getSummaryDescriptionLine(node: Readonly<FunctionNode>): string {
  return `${getFunctionName(node)} ${SUMMARY_DESCRIPTION_PLACEHOLDER}`;
}

/**
 * Returns true when a parent node can expose a function name from `key.name`.
 *
 * @param parent - Parent node to inspect.
 * @returns True when parent has an identifier key.
 */
function hasIdentifierKey(
  parent: TSESTree.Node | null | undefined,
): parent is NamedKeyParentNode {
  return isNamedKeyParentNode(parent) && isIdentifierNode(parent.key);
}

/**
 * Returns true when a JSDoc comment contains the requested tag.
 *
 * @param comment - JSDoc block comment.
 * @param tagName - Tag name without `@`.
 * @returns True when the tag exists.
 */
function hasJsdocTag(
  comment: Readonly<TSESTree.Comment>,
  tagName: Readonly<JsdocTagName>,
): boolean {
  return new RegExp(String.raw`@${tagName}\b`, 'u').test(comment.value);
}

/**
 * Returns true when a JSDoc comment includes return-value documentation.
 *
 * @param comment - JSDoc block comment.
 * @returns True when comment includes @returns or @return.
 */
function hasReturnJsdocTag(comment: Readonly<TSESTree.Comment>): boolean {
  return hasJsdocTag(comment, JsdocTagName.Returns) || hasJsdocTag(comment, JsdocTagName.Return);
}

/**
 * Returns true when a function has at least one return statement with a value.
 *
 * @param node - Function node to inspect.
 * @param sourceCode - ESLint source code helper.
 * @returns True when function returns a value.
 */
function hasReturnWithValue(
  node: Readonly<FunctionNode>,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  const body = node.body;
  return (
    isExpressionBodiedArrowFunction(node) ||
    (body.type === AST_NODE_TYPES.BlockStatement &&
      hasDescendant(body, sourceCode, isReturnWithValueNode, isNestedControlFlowBoundaryNode))
  );
}

/**
 * Returns true when function body contains a throw statement.
 *
 * @param node - Function node to inspect.
 * @param sourceCode - ESLint source code helper.
 * @returns True when function throws.
 */
function hasThrowStatement(
  node: Readonly<FunctionNode>,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return false;
  }
  return hasDescendant(
    node.body,
    sourceCode,
    isThrowStatementNode,
    isNestedControlFlowBoundaryNode,
  );
}

/**
 * Returns true when node is an arrow function with an expression body.
 *
 * @param node - Function node to inspect.
 * @returns True when node is expression-bodied arrow function.
 */
function isExpressionBodiedArrowFunction(node: Readonly<FunctionNode>): boolean {
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression &&
    node.body.type !== AST_NODE_TYPES.BlockStatement
  );
}

/**
 * Returns true when generated JSDoc must include a @returns tag.
 *
 * @param node - Function node to inspect.
 * @param sourceCode - ESLint source code helper.
 * @param jsdocComment - Existing JSDoc block comment, or null.
 * @returns True when @returns is required and currently missing.
 */
function isMissingReturnsTag(
  node: Readonly<FunctionNode>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  jsdocComment: TSESTree.Comment | null,
): boolean {
  if (!hasReturnWithValue(node, sourceCode)) {
    return false;
  }
  return jsdocComment === null || !hasReturnJsdocTag(jsdocComment);
}

/**
 * Returns true when generated JSDoc must include an @throws tag.
 *
 * @param node - Function node to inspect.
 * @param sourceCode - ESLint source code helper.
 * @param jsdocComment - Existing JSDoc block comment, or null.
 * @returns True when @throws is required and currently missing.
 */
function isMissingThrowsTag(
  node: Readonly<FunctionNode>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  jsdocComment: TSESTree.Comment | null,
): boolean {
  if (!hasThrowStatement(node, sourceCode)) {
    return false;
  }
  return jsdocComment === null || !hasJsdocTag(jsdocComment, JsdocTagName.Throws);
}

/**
 * Returns true when node can expose an identifier key.
 *
 * @param node - Node to inspect.
 * @returns True when node can have a named key.
 */
function isNamedKeyParentNode(
  node: TSESTree.Node | null | undefined,
): node is NamedKeyParentNode {
  return node !== null && node !== undefined && NAMED_KEY_PARENT_TYPES.has(node.type);
}

/**
 * Returns true when a node should stop return-statement traversal.
 *
 * @param node - AST node to inspect.
 * @returns True when the node is a nested function or class boundary.
 */
function isNestedControlFlowBoundaryNode(node: Readonly<TSESTree.Node>): boolean {
  return NESTED_CONTROL_FLOW_BOUNDARY_TYPES.has(node.type);
}

/**
 * Returns true when a node is `return` with a non-null argument.
 *
 * @param node - Node to inspect.
 * @returns True when node returns a value.
 */
function isReturnWithValueNode(node: Readonly<TSESTree.Node>): node is TSESTree.ReturnStatement {
  return node.type === AST_NODE_TYPES.ReturnStatement && node.argument !== null;
}

/**
 * Returns true when a statement is `throw`.
 *
 * @param node - Node to inspect.
 * @returns True when node is a throw statement.
 */
function isThrowStatementNode(node: Readonly<TSESTree.Node>): node is TSESTree.ThrowStatement {
  return node.type === AST_NODE_TYPES.ThrowStatement;
}

/**
 * Reports missing JSDoc on a function-like construct.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 */
function reportMissingJsdoc(
  context: Readonly<RequireJsdocFunctionsContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<FunctionNode>,
): void {
  const functionName = getFunctionName(node);
  if (functionName === ANONYMOUS_FUNCTION_NAME) {
    return;
  }
  const targetNode = getTargetNode(node);
  const jsdocComment = getJsdocComment(sourceCode, targetNode);
  if (jsdocComment !== null) {
    reportMissingJsdocTags(context, sourceCode, node, jsdocComment);
    return;
  }
  reportMissingJsdocComment(context, sourceCode, node, targetNode);
}

/**
 * Reports a missing JSDoc comment for a named function-like construct.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 * @param targetNode - JSDoc owner target node.
 */
function reportMissingJsdocComment(
  context: Readonly<RequireJsdocFunctionsContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<FunctionNode>,
  targetNode: Readonly<TSESTree.Node>,
): void {
  context.report({
    node,
    messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
    data: { name: getFunctionName(node) },
    fix: createMissingJsdocFix.bind(undefined, sourceCode, targetNode, node),
  });
}

/**
 * Reports missing `@param` tags for functions with parameters.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 * @param jsdocComment - Existing JSDoc block comment.
 */
function reportMissingJsdocParam(
  context: Readonly<RequireJsdocFunctionsContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<FunctionNode>,
  jsdocComment: Readonly<TSESTree.Comment>,
): void {
  if (node.params.length === 0) {
    return;
  }
  if (getJsdocParamTagCount(jsdocComment) >= node.params.length) {
    return;
  }
  context.report({
    node,
    messageId: RequireJsdocFunctionsMessageId.MissingJsdocParam,
    data: { name: getFunctionName(node) },
    fix: createMissingJsdocTagFix.bind(undefined, sourceCode, node, jsdocComment),
  });
}

/**
 * Reports missing `@returns` or `@return` tags for functions returning values.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 * @param jsdocComment - Existing JSDoc block comment.
 */
function reportMissingJsdocReturns(
  context: Readonly<RequireJsdocFunctionsContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<FunctionNode>,
  jsdocComment: Readonly<TSESTree.Comment>,
): void {
  if (!hasReturnWithValue(node, sourceCode)) {
    return;
  }
  if (hasReturnJsdocTag(jsdocComment)) {
    return;
  }
  context.report({
    node,
    messageId: RequireJsdocFunctionsMessageId.MissingJsdocReturns,
    data: { name: getFunctionName(node) },
    fix: createMissingJsdocTagFix.bind(undefined, sourceCode, node, jsdocComment),
  });
}

/**
 * Reports missing JSDoc tags based on function signature and body behavior.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 * @param jsdocComment - Existing JSDoc block comment.
 */
function reportMissingJsdocTags(
  context: Readonly<RequireJsdocFunctionsContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<FunctionNode>,
  jsdocComment: Readonly<TSESTree.Comment>,
): void {
  reportMissingJsdocParam(context, sourceCode, node, jsdocComment);
  reportMissingJsdocReturns(context, sourceCode, node, jsdocComment);
  reportMissingJsdocThrows(context, sourceCode, node, jsdocComment);
}

/**
 * Reports missing `@throws` tags for functions that throw.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 * @param jsdocComment - Existing JSDoc block comment.
 */
function reportMissingJsdocThrows(
  context: Readonly<RequireJsdocFunctionsContext>,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<FunctionNode>,
  jsdocComment: Readonly<TSESTree.Comment>,
): void {
  if (!hasThrowStatement(node, sourceCode)) {
    return;
  }
  if (hasJsdocTag(jsdocComment, JsdocTagName.Throws)) {
    return;
  }
  context.report({
    node,
    messageId: RequireJsdocFunctionsMessageId.MissingJsdocThrows,
    data: { name: getFunctionName(node) },
    fix: createMissingJsdocTagFix.bind(undefined, sourceCode, node, jsdocComment),
  });
}

/** Requires JSDoc for function-like constructs in non-test source files. */
export const requireJsdocFunctions = createRule({
  name: 'require-jsdoc-functions',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Require JSDoc comments on all functions and require @param/@returns/@throws tags when applicable (except in test files)',
    },
    messages: {
      missingJsdoc: 'Function "{{name}}" is missing a JSDoc comment',
      missingJsdocParam:
        'Function "{{name}}" has parameters but its JSDoc is missing required @param tags',
      missingJsdocReturns:
        'Function "{{name}}" returns a value but its JSDoc is missing an @returns tag',
      missingJsdocThrows: 'Function "{{name}}" throws but its JSDoc is missing an @throws tag',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireJsdocFunctionsListeners,
});

export default requireJsdocFunctions;
