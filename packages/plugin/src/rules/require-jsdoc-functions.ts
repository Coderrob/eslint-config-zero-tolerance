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

import { AST_NODE_TYPES, AST_TOKEN_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import {
  type FunctionNode,
  isIdentifierNode,
  isTestFile,
  isVariableDeclarationNode,
  isVariableDeclaratorNode,
} from '../ast-guards';
import { getIdentifierName } from '../ast-helpers';
import { ANONYMOUS_FUNCTION_NAME } from '../constants';
import { JSDOC_BLOCK_MARKER } from '../rule-constants';
import { createRule } from '../rule-factory';

const NAMED_KEY_PARENT_TYPES = new Set([
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.Property,
]);
const PARENT_OWNED_TARGET_TYPES = new Set([
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.Property,
]);

type RequireJsdocFunctionsContext = Readonly<TSESLint.RuleContext<'missingJsdoc', []>>;

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
 * @param node - The function node to check.
 * @returns The declaration name if available, otherwise null.
 */
function getDeclarationFunctionName(node: FunctionNode): string | null {
  if (node.type !== AST_NODE_TYPES.FunctionDeclaration) {
    return null;
  }
  return getIdentifierName(node.id);
}

/**
 * Returns a function name inferred from common declaration/assignment patterns.
 *
 * @param node - The function node to get the name for.
 * @returns The inferred function name.
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
 * Returns key name for method/property based function declarations.
 *
 * @param node - The function node to check.
 * @returns The key name if available, otherwise null.
 */
function getNamedKeyFunctionName(node: FunctionNode): string | null {
  if (!hasIdentifierKey(node.parent)) {
    return null;
  }
  return getIdentifierName(node.parent.key);
}

/**
 * Returns method/property parent nodes that own JSDoc placement.
 *
 * @param node - The function node.
 * @returns The parent node if it owns JSDoc, otherwise null.
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
 * @param node - The function node.
 * @returns The target node for JSDoc placement.
 */
function getTargetNode(node: FunctionNode): TSESTree.Node {
  const parentOwnedNode = getParentOwnedTargetNode(node);
  if (parentOwnedNode !== null) {
    return parentOwnedNode;
  }
  return getVariableOwnedTargetNode(node) ?? node;
}

/**
 * Returns parent variable declaration node when declarator is inside one.
 *
 * @param node - The variable declarator node.
 * @returns The parent variable declaration if found, null otherwise.
 */
function getVariableDeclarationParent(
  node: TSESTree.VariableDeclarator,
): TSESTree.VariableDeclaration | null {
  return isVariableDeclarationNode(node.parent) ? node.parent : null;
}

/**
 * Returns the final JSDoc target for variable declarations with function initializers.
 *
 * @param declarator - The variable declarator node.
 * @param declaration - The variable declaration node.
 * @returns The appropriate target node for JSDoc placement.
 */
function getVariableDeclarationTarget(
  declarator: TSESTree.VariableDeclarator,
  declaration: TSESTree.VariableDeclaration,
): TSESTree.Node {
  return declaration.declarations.length === 1 ? declaration : declarator;
}

/**
 * Returns variable declarator identifier name for assigned functions.
 *
 * @param node - The function node to check.
 * @returns The variable name if available, otherwise null.
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
 * @param node - The function node.
 * @returns The target node for JSDoc ownership, or null.
 */
function getVariableOwnedTargetNode(node: FunctionNode): TSESTree.Node | null {
  if (!isVariableDeclaratorNode(node.parent)) {
    return null;
  }
  const declaration = getVariableDeclarationParent(node.parent);
  if (declaration === null) {
    return node.parent;
  }
  return getVariableDeclarationTarget(node.parent, declaration);
}

/**
 * Returns true when a parent node can expose a function name from `key.name`.
 *
 * @param parent - The parent node to check.
 * @returns True if the parent has an identifier key, false otherwise.
 */
function hasIdentifierKey(
  parent: TSESTree.Node | null | undefined,
): parent is TSESTree.MethodDefinition | TSESTree.PropertyDefinition | TSESTree.Property {
  return isNamedKeyParentNode(parent) && isIdentifierNode(parent.key);
}

/**
 * Returns true when a JSDoc block appears directly before the node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - The node to check for JSDoc comments.
 * @returns True if a JSDoc comment is found before the node, false otherwise.
 */
function hasJsdocComment(sourceCode: Readonly<TSESLint.SourceCode>, node: TSESTree.Node): boolean {
  const comments = sourceCode.getCommentsBefore(node);
  return comments.some(isJsdocBlockComment);
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
 * Returns true when node can expose an identifier key.
 *
 * @param node - The node to check.
 * @returns True if the node can have a named key, false otherwise.
 */
function isNamedKeyParentNode(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MethodDefinition | TSESTree.PropertyDefinition | TSESTree.Property {
  return node !== null && node !== undefined && NAMED_KEY_PARENT_TYPES.has(node.type);
}

/**
 * Returns true when parent node type owns JSDoc placement for enclosed function.
 *
 * @param type - The node type to check.
 * @returns True if the type owns JSDoc placement, false otherwise.
 */
function isParentOwnedTargetType(type: AST_NODE_TYPES): boolean {
  return PARENT_OWNED_TARGET_TYPES.has(type);
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
  if (hasJsdocComment(sourceCode, targetNode)) {
    return;
  }
  context.report({
    node,
    messageId: 'missingJsdoc',
    data: { name: getFunctionName(node) },
  });
}

/** Requires JSDoc for function-like constructs in non-test source files. */
export const requireJsdocFunctions = createRule({
  name: 'require-jsdoc-functions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require JSDoc comments on all functions (except in test files)',
    },
    messages: {
      missingJsdoc: 'Function "{{name}}" is missing a JSDoc comment',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireJsdocFunctionsListeners,
});

export default requireJsdocFunctions;
