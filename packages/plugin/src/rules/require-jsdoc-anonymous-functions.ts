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
import { type FunctionNode, isTestFile, isVariableDeclaratorNode } from '../ast-guards';
import { resolveFunctionName } from '../ast-helpers';
import { ANONYMOUS_FUNCTION_NAME } from '../constants';
import { JSDOC_BLOCK_MARKER } from '../rule-constants';
import { createRule } from '../rule-factory';

const PARENT_OWNED_TARGET_TYPES = new Set([
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.Property,
]);
const SUMMARY_DESCRIPTION_PLACEHOLDER = 'TODO: describe';

export enum RequireJsdocAnonymousFunctionsMessageId {
  MissingJsdoc = 'missingJsdoc',
}

type RequireJsdocAnonymousFunctionsContext = Readonly<
  TSESLint.RuleContext<RequireJsdocAnonymousFunctionsMessageId, []>
>;

/**
 * Builds full JSDoc block text for insertion ahead of an anonymous function target node.
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
  const lines = [
    `${indent}/**`,
    `${indent} * ${resolveFunctionName(node)} ${SUMMARY_DESCRIPTION_PLACEHOLDER}`,
    `${indent} */`,
  ];
  return `${lines.join('\n')}\n`;
}

/**
 * Creates fixer for anonymous functions missing a full JSDoc block.
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
 * Creates listeners for require-jsdoc-anonymous-functions rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireJsdocAnonymousFunctionsListeners(
  context: RequireJsdocAnonymousFunctionsContext,
): TSESLint.RuleListener {
  if (isTestFile(context.filename)) {
    return {};
  }
  const sourceCode = context.sourceCode;
  return {
    ArrowFunctionExpression: reportMissingAnonymousJsdoc.bind(undefined, context, sourceCode),
    FunctionDeclaration: reportMissingAnonymousJsdoc.bind(undefined, context, sourceCode),
    FunctionExpression: reportMissingAnonymousJsdoc.bind(undefined, context, sourceCode),
  };
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
  const lineText = String(sourceCode.lines[node.loc.start.line - 1]);
  return lineText.replace(/\S.*$/u, '');
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
 * Returns the node that should own the JSDoc comment for the function.
 *
 * @param node - Function node.
 * @returns Target node for JSDoc placement.
 */
function getTargetNode(node: FunctionNode): TSESTree.Node {
  return getParentOwnedTargetNode(node) ?? getVariableOwnedTargetNode(node) ?? node;
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
  const declaration = node.parent.parent;
  if (declaration.declarations.length !== 1) {
    return node.parent;
  }
  return declaration.parent.type === AST_NODE_TYPES.ExportNamedDeclaration
    ? declaration.parent
    : declaration;
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
 * Returns true when a parent node type owns JSDoc placement for enclosed functions.
 *
 * @param type - Node type to inspect.
 * @returns True when node type owns JSDoc placement.
 */
function isParentOwnedTargetType(type: AST_NODE_TYPES): boolean {
  return PARENT_OWNED_TARGET_TYPES.has(type);
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
 * Reports missing JSDoc on anonymous function-like constructs.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 */
function reportMissingAnonymousJsdoc(
  context: RequireJsdocAnonymousFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
): void {
  const targetNode = getTargetNode(node);
  if (!shouldReportAnonymousJsdoc(node, sourceCode, targetNode)) {
    return;
  }
  reportMissingAnonymousJsdocForTarget(context, sourceCode, node, targetNode);
}

/**
 * Reports a missing JSDoc comment for a specific anonymous function target.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 * @param targetNode - JSDoc owner node for the function.
 */
function reportMissingAnonymousJsdocForTarget(
  context: RequireJsdocAnonymousFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
  targetNode: TSESTree.Node,
): void {
  context.report({
    node,
    messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
    data: { name: ANONYMOUS_FUNCTION_NAME },
    fix: createMissingJsdocFix.bind(undefined, sourceCode, targetNode, node),
  });
}

/**
 * Returns true when an anonymous function target is missing JSDoc.
 *
 * @param node - Function-like AST node.
 * @param sourceCode - ESLint source code helper.
 * @param targetNode - JSDoc owner node for the function.
 * @returns True when the function is anonymous and missing JSDoc.
 */
function shouldReportAnonymousJsdoc(
  node: FunctionNode,
  sourceCode: Readonly<TSESLint.SourceCode>,
  targetNode: TSESTree.Node,
): boolean {
  if (resolveFunctionName(node) !== ANONYMOUS_FUNCTION_NAME) {
    return false;
  }
  return getJsdocComment(sourceCode, targetNode) === null;
}

/** Requires JSDoc for anonymous function-like constructs in non-test source files. */
export const requireJsdocAnonymousFunctions = createRule({
  name: 'require-jsdoc-anonymous-functions',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Require JSDoc comments on anonymous function-like constructs (except in test files)',
    },
    messages: {
      missingJsdoc: 'Function "{{name}}" is missing a JSDoc comment',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireJsdocAnonymousFunctionsListeners,
});

export default requireJsdocAnonymousFunctions;
