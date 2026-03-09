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

type SortableFunctionNode = TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator;
type SortableFunction = Readonly<{
  name: string;
  node: SortableFunctionNode;
}>;
type SortFunctionsContext = Readonly<TSESLint.RuleContext<'unsortedFunction', []>>;
type SortableFunctions = SortableFunction[];

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
  const previousNode = getSwappableNode(previousFunction.node);
  const currentNode = getSwappableNode(currentFunction.node);
  if (previousNode === null || currentNode === null) {
    return null;
  }
  return swapSortableFunctionNodes.bind(undefined, sourceCode, previousNode, currentNode);
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
  if (node.id === null) {
    return;
  }
  functions.push({ name: node.id.name, node });
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
function swapSortableFunctionNodes(
  sourceCode: Readonly<TSESLint.SourceCode>,
  previousNode: TSESTree.Node,
  currentNode: TSESTree.Node,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  const previousText = sourceCode.getText(previousNode);
  const currentText = sourceCode.getText(currentNode);
  const betweenText = sourceCode.text.slice(previousNode.range[1], currentNode.range[0]);
  return fixer.replaceTextRange(
    [previousNode.range[0], currentNode.range[1]],
    `${currentText}${betweenText}${previousText}`,
  );
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
