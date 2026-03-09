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
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils';
import {
  type FunctionNode,
  isIdentifierNode,
  isTestFile,
  isVariableDeclaratorNode,
} from '../ast-guards';
import { getIdentifierName } from '../ast-helpers';
import { ANONYMOUS_FUNCTION_NAME } from '../constants';
import { JSDOC_BLOCK_MARKER } from '../rule-constants';
import { createRule } from '../rule-factory';

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
const PARENT_OWNED_TARGET_TYPES = new Set([
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.Property,
]);
const RETURNS_DESCRIPTION_PLACEHOLDER = 'TODO: describe return value';
const SUMMARY_DESCRIPTION_PLACEHOLDER = 'TODO: describe';
const THROWS_DESCRIPTION_PLACEHOLDER = 'TODO: describe error condition';

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
  const closingMatch = commentText.match(/\n([ \t]*)\*\/$/u);
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
    lines.push(` * ${inlineDescription}`);
  }
  for (const tagLine of tagLines) {
    lines.push(` * ${tagLine}`);
  }
  lines.push(' */');
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
  targetNode: TSESTree.Node,
  node: FunctionNode,
): string {
  const indent = getLineIndentation(sourceCode, targetNode);
  const lines = [`${indent}/**`, `${indent} * ${getSummaryDescriptionLine(node)}`];
  const missingTagLines = getMissingTagLines(node, sourceCode, null);
  for (const tagLine of missingTagLines) {
    lines.push(`${indent} * ${tagLine}`);
  }
  lines.push(`${indent} */`);
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
  targetNode: TSESTree.Node,
  node: FunctionNode,
  fixer: TSESLint.RuleFixer,
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
 * @returns Rule fix for updating JSDoc tags, or null when no tags are missing.
 */
function createMissingJsdocTagFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
  jsdocComment: TSESTree.Comment,
  fixer: TSESLint.RuleFixer,
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
  context: RequireJsdocFunctionsContext,
): TSESLint.RuleListener {
  if (isTestFile(context.filename)) {
    return {};
  }
  const sourceCode = context.sourceCode;
  return {
    ArrowFunctionExpression: reportMissingJsdoc.bind(undefined, context, sourceCode),
    FunctionDeclaration: reportMissingJsdoc.bind(undefined, context, sourceCode),
    FunctionExpression: reportMissingJsdoc.bind(undefined, context, sourceCode),
  };
}

/**
 * Returns declaration identifier name for function declarations.
 *
 * @param node - Function node to check.
 * @returns The declaration name if available, otherwise null.
 */
function getDeclarationFunctionName(node: FunctionNode): string | null {
  if (node.type !== AST_NODE_TYPES.FunctionDeclaration) {
    return null;
  }
  return getIdentifierName(node.id);
}

/**
 * Returns a function name inferred from common declaration and assignment patterns.
 *
 * @param node - Function node to name.
 * @returns Inferred function name.
 */
function getFunctionName(node: FunctionNode): string {
  const names = [
    getDeclarationFunctionName(node),
    getVariableFunctionName(node),
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
 * Returns the nearest JSDoc block that appears before a target node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node to inspect.
 * @returns The nearest JSDoc block, or null.
 */
function getJsdocComment(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): TSESTree.Comment | null {
  const comments = sourceCode.getCommentsBefore(node);
  const jsdocComments = comments.filter(isJsdocBlockComment);
  return jsdocComments.at(-1) ?? null;
}

/**
 * Returns the number of `@param` tags present in a JSDoc comment.
 *
 * @param comment - JSDoc block comment.
 * @returns Number of parameter tags.
 */
function getJsdocParamTagCount(comment: TSESTree.Comment): number {
  const matches = comment.value.match(new RegExp(String.raw`@${JsdocTagName.Param}\b`, 'gu'));
  return matches === null ? 0 : matches.length;
}

/**
 * Returns indentation prefix for the line containing the node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node whose line indentation should be read.
 * @returns Whitespace indentation prefix.
 */
function getLineIndentation(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): string {
  const lineText = sourceCode.lines[node.loc.start.line - 1] ?? '';
  return lineText.match(/^\s*/u)?.[0] ?? '';
}

/**
 * Returns expected `@param` tag names that are missing from JSDoc.
 *
 * @param node - Function node to inspect.
 * @param jsdocComment - Existing JSDoc block comment, or null.
 * @returns Missing parameter names in declaration order.
 */
function getMissingParamTagNames(
  node: FunctionNode,
  jsdocComment: TSESTree.Comment | null,
): ReadonlyArray<string> {
  const existingParamTags = jsdocComment === null ? 0 : getJsdocParamTagCount(jsdocComment);
  if (existingParamTags >= node.params.length) {
    return [];
  }
  const names: string[] = [];
  for (let index = existingParamTags; index < node.params.length; index += 1) {
    names.push(getParamTagName(node.params[index], index + 1));
  }
  return names;
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
  node: FunctionNode,
  sourceCode: Readonly<TSESLint.SourceCode>,
  jsdocComment: TSESTree.Comment | null,
): ReadonlyArray<string> {
  const missingTags: string[] = [];
  const missingParams = getMissingParamTagNames(node, jsdocComment);
  for (const name of missingParams) {
    missingTags.push(`@${JsdocTagName.Param} ${name} ${PARAM_DESCRIPTION_PLACEHOLDER}`);
  }
  if (isMissingReturnsTag(node, sourceCode, jsdocComment)) {
    missingTags.push(`@${JsdocTagName.Returns} ${RETURNS_DESCRIPTION_PLACEHOLDER}`);
  }
  if (isMissingThrowsTag(node, sourceCode, jsdocComment)) {
    missingTags.push(`@${JsdocTagName.Throws} {Error} ${THROWS_DESCRIPTION_PLACEHOLDER}`);
  }
  return missingTags;
}

/**
 * Returns key name for method and property based function declarations.
 *
 * @param node - Function node to inspect.
 * @returns The key name if available, otherwise null.
 */
function getNamedKeyFunctionName(node: FunctionNode): string | null {
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
function getParamTagName(param: TSESTree.Parameter, position: number): string {
  if (isNamedParamIdentifier(param)) {
    return param.name;
  }
  if (isNamedParamAssignment(param)) {
    return param.left.name;
  }
  if (isNamedParamRestElement(param)) {
    return param.argument.name;
  }
  return `param${position}`;
}

/**
 * Returns method and property parent nodes that own JSDoc placement.
 *
 * @param node - Function node.
 * @returns Parent node if it owns JSDoc, otherwise null.
 */
function getParentOwnedTargetNode(node: FunctionNode): TSESTree.Node | null {
  if (!isParentOwnedTargetType(node.parent.type)) {
    return null;
  }
  return node.parent;
}

/**
 * Returns a one-line summary sentence for generated JSDoc blocks.
 *
 * @param node - Function node to describe.
 * @returns Summary sentence text.
 */
function getSummaryDescriptionLine(node: FunctionNode): string {
  return `${getFunctionName(node)} ${SUMMARY_DESCRIPTION_PLACEHOLDER}`;
}

/**
 * Returns the node that should own the JSDoc comment for the function.
 *
 * @param node - Function node.
 * @returns Target node for JSDoc placement.
 */
function getTargetNode(node: FunctionNode): TSESTree.Node {
  return getParentOwnedTargetNode(node) ?? getVariableOwnedTargetNode(node) ?? node;
}

/**
 * Returns variable declarator identifier name for assigned functions.
 *
 * @param node - Function node to inspect.
 * @returns Variable name if available, otherwise null.
 */
function getVariableFunctionName(node: FunctionNode): string | null {
  if (!isVariableDeclaratorNode(node.parent)) {
    return null;
  }
  return getIdentifierName(node.parent.id);
}

/**
 * Returns variable-related target node for JSDoc ownership when applicable.
 *
 * @param node - Function node.
 * @returns JSDoc owner target node, or null.
 */
function getVariableOwnedTargetNode(node: FunctionNode): TSESTree.Node | null {
  if (!isVariableDeclaratorNode(node.parent)) {
    return null;
  }
  return node.parent.parent.declarations.length === 1 ? node.parent.parent : node.parent;
}

/**
 * Returns node children extracted from one visitor-key value.
 *
 * @param value - Visitor-key value from an AST node.
 * @returns Child nodes from the value.
 */
function getVisitorArrayNodes(value: unknown): ReadonlyArray<TSESTree.Node> {
  if (Array.isArray(value)) {
    return value.filter(isNodeLike);
  }
  return isNodeLike(value) ? [value] : [];
}

/**
 * Returns direct child nodes for an AST node using source-code visitor keys.
 *
 * @param node - Node whose children should be collected.
 * @param sourceCode - ESLint source code helper.
 * @returns Child nodes for traversal.
 */
function getVisitorChildNodes(
  node: TSESTree.Node,
  sourceCode: Readonly<TSESLint.SourceCode>,
): ReadonlyArray<TSESTree.Node> {
  const childNodes: TSESTree.Node[] = [];
  for (const key of sourceCode.visitorKeys[node.type]) {
    childNodes.push(...getVisitorArrayNodes(Reflect.get(node, key)));
  }
  return childNodes;
}

/**
 * Returns true when a parent node can expose a function name from `key.name`.
 *
 * @param parent - Parent node to inspect.
 * @returns True when parent has an identifier key.
 */
function hasIdentifierKey(
  parent: TSESTree.Node | null | undefined,
): parent is TSESTree.MethodDefinition | TSESTree.PropertyDefinition | TSESTree.Property {
  return isNamedKeyParentNode(parent) && isIdentifierNode(parent.key);
}

/**
 * Returns true when a JSDoc comment contains the requested tag.
 *
 * @param comment - JSDoc block comment.
 * @param tagName - Tag name without `@`.
 * @returns True when the tag exists.
 */
function hasJsdocTag(comment: TSESTree.Comment, tagName: JsdocTagName): boolean {
  return new RegExp(String.raw`@${tagName}\b`, 'u').test(comment.value);
}

/**
 * Returns true when a JSDoc comment includes return-value documentation.
 *
 * @param comment - JSDoc block comment.
 * @returns True when comment includes @returns or @return.
 */
function hasReturnJsdocTag(comment: TSESTree.Comment): boolean {
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
  node: FunctionNode,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  const body = node.body;
  return (
    isExpressionBodiedArrowFunction(node) ||
    (body.type === AST_NODE_TYPES.BlockStatement && hasReturnWithValueInBlock(body, sourceCode))
  );
}

/**
 * Returns true when a block contains a return statement with an argument.
 *
 * Nested function and class boundaries are intentionally skipped so their
 * control flow does not affect the containing function's JSDoc requirements.
 *
 * @param body - Function block body.
 * @param sourceCode - ESLint source code helper.
 * @returns True when the block contains a return-with-value.
 */
function hasReturnWithValueInBlock(
  body: TSESTree.BlockStatement,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  return hasReturnWithValueInNodes(body.body, sourceCode);
}

/**
 * Returns true when a node contains a return statement with a value.
 *
 * @param node - Node to inspect.
 * @param sourceCode - ESLint source code helper.
 * @returns True when the node or its traversable children return a value.
 */
function hasReturnWithValueInNode(
  node: TSESTree.Node,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  if (isReturnWithValueNode(node)) {
    return true;
  }
  if (isNestedControlFlowBoundaryNode(node)) {
    return false;
  }
  return hasReturnWithValueInNodes(getVisitorChildNodes(node, sourceCode), sourceCode);
}

/**
 * Returns true when a node tree contains a return statement with a value.
 *
 * @param nodes - Root nodes to inspect.
 * @param sourceCode - ESLint source code helper.
 * @returns True when a return-with-value is found.
 */
function hasReturnWithValueInNodes(
  nodes: ReadonlyArray<TSESTree.Node>,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  for (const node of nodes) {
    if (hasReturnWithValueInNode(node, sourceCode)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when block text appears to include a throw statement.
 *
 * @param sourceCode - ESLint source code helper.
 * @param body - Function block body.
 * @returns True when a throw token pattern exists.
 */
function hasThrowByText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  body: TSESTree.BlockStatement,
): boolean {
  return /\bthrow\s+/u.test(sourceCode.getText(body));
}

/**
 * Returns true when block body contains an inline throw statement.
 *
 * @param body - Function block body.
 * @returns True when throw exists.
 */
function hasThrowInBlock(body: TSESTree.BlockStatement): boolean {
  for (const statement of body.body) {
    if (isThrowStatementNode(statement)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when function body contains a throw statement.
 *
 * @param node - Function node to inspect.
 * @param sourceCode - ESLint source code helper.
 * @returns True when function throws.
 */
function hasThrowStatement(node: FunctionNode, sourceCode: Readonly<TSESLint.SourceCode>): boolean {
  if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return false;
  }
  return hasThrowInBlock(node.body) || hasThrowByText(sourceCode, node.body);
}

/**
 * Returns true when node is an arrow function with an expression body.
 *
 * @param node - Function node to inspect.
 * @returns True when node is expression-bodied arrow function.
 */
function isExpressionBodiedArrowFunction(node: FunctionNode): boolean {
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression &&
    node.body.type !== AST_NODE_TYPES.BlockStatement
  );
}

/**
 * Returns true when a comment token is a JSDoc block.
 *
 * @param comment - Comment token to inspect.
 * @returns True when token is a JSDoc block comment.
 */
function isJsdocBlockComment(comment: TSESTree.Comment): boolean {
  return comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith(JSDOC_BLOCK_MARKER);
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
  node: FunctionNode,
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
  node: FunctionNode,
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
): node is TSESTree.MethodDefinition | TSESTree.PropertyDefinition | TSESTree.Property {
  return node !== null && node !== undefined && NAMED_KEY_PARENT_TYPES.has(node.type);
}

/**
 * Returns true when a function parameter is an assignment with identifier lhs.
 *
 * @param node - Parameter node to inspect.
 * @returns True when parameter resolves to identifier through default assignment.
 */
function isNamedParamAssignment(
  node: TSESTree.Parameter,
): node is TSESTree.AssignmentPattern & { left: TSESTree.Identifier } {
  return (
    node.type === AST_NODE_TYPES.AssignmentPattern && node.left.type === AST_NODE_TYPES.Identifier
  );
}

/**
 * Returns true when a function parameter is a named identifier.
 *
 * @param node - Parameter node to inspect.
 * @returns True when parameter resolves to an identifier name.
 */
function isNamedParamIdentifier(node: TSESTree.Parameter): node is TSESTree.Identifier {
  return node.type === AST_NODE_TYPES.Identifier;
}

/**
 * Returns true when a function parameter is a rest identifier.
 *
 * @param node - Parameter node to inspect.
 * @returns True when parameter resolves to rest identifier.
 */
function isNamedParamRestElement(
  node: TSESTree.Parameter,
): node is TSESTree.RestElement & { argument: TSESTree.Identifier } {
  return (
    node.type === AST_NODE_TYPES.RestElement && node.argument.type === AST_NODE_TYPES.Identifier
  );
}

/**
 * Returns true when a node should stop return-statement traversal.
 *
 * @param node - AST node to inspect.
 * @returns True when the node is a nested function or class boundary.
 */
function isNestedControlFlowBoundaryNode(node: TSESTree.Node): boolean {
  return NESTED_CONTROL_FLOW_BOUNDARY_TYPES.has(node.type);
}

/**
 * Returns true when an unknown value is an AST node.
 *
 * @param value - Value to inspect.
 * @returns True when value has a node-like `type` property.
 */
function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
  );
}

/**
 * Returns true when a parent node type owns JSDoc placement for enclosed functions.
 *
 * @param type - Node type to inspect.
 * @returns True when node type owns JSDoc placement.
 */
function isParentOwnedTargetType(type: AST_NODE_TYPES): boolean {
  return PARENT_OWNED_TARGET_TYPES.has(type);
}

/**
 * Returns true when a node is `return` with a non-null argument.
 *
 * @param node - Node to inspect.
 * @returns True when node returns a value.
 */
function isReturnWithValueNode(node: TSESTree.Node): node is TSESTree.ReturnStatement {
  return node.type === AST_NODE_TYPES.ReturnStatement && node.argument !== null;
}

/**
 * Returns true when a node starts on its own line with only indentation before it.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node that would receive an inserted JSDoc block.
 * @returns True when inserting before the node is formatting-safe.
 */
function isStandaloneLineTarget(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node,
): boolean {
  const lineText = sourceCode.lines[node.loc.start.line - 1] ?? '';
  const prefix = lineText.slice(0, node.loc.start.column);
  return prefix.trim().length === 0;
}

/**
 * Returns true when a statement is `throw`.
 *
 * @param statement - Statement node to inspect.
 * @returns True when statement is a throw statement.
 */
function isThrowStatementNode(statement: TSESTree.Statement): boolean {
  return statement.type === AST_NODE_TYPES.ThrowStatement;
}

/**
 * Reports missing JSDoc on a function-like construct.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 */
function reportMissingJsdoc(
  context: RequireJsdocFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
): void {
  const targetNode = getTargetNode(node);
  const jsdocComment = getJsdocComment(sourceCode, targetNode);
  if (jsdocComment === null) {
    context.report({
      node,
      messageId: RequireJsdocFunctionsMessageId.MissingJsdoc,
      data: { name: getFunctionName(node) },
      fix: createMissingJsdocFix.bind(undefined, sourceCode, targetNode, node),
    });
    return;
  }
  reportMissingJsdocTags(context, sourceCode, node, jsdocComment);
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
  context: RequireJsdocFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
  jsdocComment: TSESTree.Comment,
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
  context: RequireJsdocFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
  jsdocComment: TSESTree.Comment,
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
  context: RequireJsdocFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
  jsdocComment: TSESTree.Comment,
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
  context: RequireJsdocFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
  jsdocComment: TSESTree.Comment,
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
