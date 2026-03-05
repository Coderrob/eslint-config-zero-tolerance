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

import {
  AST_NODE_TYPES,
  AST_TOKEN_TYPES,
  ESLintUtils,
  TSESLint,
  TSESTree,
} from '@typescript-eslint/utils';
import { ANONYMOUS_FUNCTION_NAME, RULE_CREATOR_URL } from '../constants';
import { JSDOC_BLOCK_MARKER } from '../rule-constants';
import { isDefined } from '../type-guards';
import {
  type FunctionNode,
  isIdentifierNode,
  isTestFile,
  isVariableDeclaratorNode,
  isVariableDeclarationNode,
} from '../ast-guards';
import { getIdentifierName } from '../ast-helpers';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const NAMED_KEY_PARENT_TYPES = new Set([
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.Property,
]);

/**
 * Returns true when a parent node can expose a function name from `key.name`.
 *
 * @param parent - The parent node to check.
 * @returns True if the parent has an identifier key, false otherwise.
 */
function hasIdentifierKey(
  parent: TSESTree.Node | null | undefined,
): parent is TSESTree.MethodDefinition | TSESTree.PropertyDefinition | TSESTree.Property {
  if (!isNamedKeyParentNode(parent)) {
    return false;
  }
  return isIdentifierNode(parent.key);
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
  return isDefined(node) && NAMED_KEY_PARENT_TYPES.has(node.type);
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
 * Returns variable-related target node for JSDoc ownership when applicable.
 * @param node - The function node.
 * @returns The target node for JSDoc ownership, or null.
 */
function getVariableOwnedTargetNode(node: FunctionNode): TSESTree.Node | null {
  const parent = node.parent;
  if (!isVariableDeclaratorNode(parent)) {
    return null;
  }
  const declaration = getVariableDeclarationParent(parent);
  if (declaration === null) {
    return parent;
  }
  return getVariableDeclarationTarget(parent, declaration);
}

/**
 * Returns the final JSDoc target for variable declarations with function initializers.
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
 * Returns parent variable declaration node when declarator is inside one.
 * @param node - The variable declarator node.
 * @returns The parent variable declaration if found, null otherwise.
 */
function getVariableDeclarationParent(
  node: TSESTree.VariableDeclarator,
): TSESTree.VariableDeclaration | null {
  if (!isVariableDeclarationNode(node.parent)) {
    return null;
  }
  return node.parent;
}

/**
 * Returns true when parent node type owns JSDoc placement for enclosed function.
 * @param type - The node type to check.
 * @returns True if the type owns JSDoc placement, false otherwise.
 */
function isParentOwnedTargetType(type: AST_NODE_TYPES): boolean {
  return (
    type === AST_NODE_TYPES.MethodDefinition ||
    type === AST_NODE_TYPES.PropertyDefinition ||
    type === AST_NODE_TYPES.Property
  );
}

/**
 * Returns true when a JSDoc block appears directly before the node.
 * @param context - The ESLint rule context.
 * @param node - The node to check for JSDoc comments.
 * @returns True if a JSDoc comment is found before the node, false otherwise.
 */
function hasJsdocComment(sourceCode: Readonly<TSESLint.SourceCode>, node: TSESTree.Node): boolean {
  const comments = sourceCode.getCommentsBefore(node);
  return comments.some(
    (comment: TSESTree.Comment) =>
      comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith(JSDOC_BLOCK_MARKER),
  );
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
  create(context) {
    const sourceCode = context.sourceCode;

    if (isTestFile(context.filename)) {
      return {};
    }

    const checkFunction = (node: FunctionNode): void => {
      const targetNode = getTargetNode(node);
      if (hasJsdocComment(sourceCode, targetNode)) {
        return;
      }
      context.report({
        node,
        messageId: 'missingJsdoc',
        data: { name: getFunctionName(node) },
      });
    };

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});

export default requireJsdocFunctions;
