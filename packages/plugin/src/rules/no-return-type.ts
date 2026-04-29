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
import { isNamedIdentifierNode } from '../helpers/ast-guards';
import { RETURN_TYPE_NAME } from './support/rule-constants';
import { createRule } from './support/rule-factory';

enum NoReturnTypeMessageId {
  NoReturnType = 'noReturnType',
  UseExplicitReturnType = 'useExplicitReturnType',
}
type FunctionLikeNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;
type NoReturnTypeContext = Readonly<TSESLint.RuleContext<NoReturnTypeMessageId, []>>;

/**
 * Checks whether a type reference targets ReturnType and reports it.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type reference node to inspect.
 */
function checkTypeReference(context: Readonly<NoReturnTypeContext>, node: Readonly<TSESTree.TSTypeReference>): void {
  if (!isReturnTypeReference(node)) {
    return;
  }

  reportReturnType(context, node);
}

/**
 * Creates a suggestion to replace ReturnType with a same-file explicit return annotation.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - ReturnType reference node.
 * @returns Suggestion entries.
 */
function createExplicitReturnTypeSuggestions(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSTypeReference>,
): TSESLint.ReportSuggestionArray<NoReturnTypeMessageId> {
  const returnTypeText = getSameFileReturnTypeText(sourceCode, node);
  if (returnTypeText === null) {
    return [];
  }
  return [
    {
      messageId: NoReturnTypeMessageId.UseExplicitReturnType,
      data: { type: returnTypeText },
      fix: replaceReturnTypeReference.bind(undefined, node, returnTypeText),
    },
  ];
}

/**
 * Creates listeners that report TypeScript ReturnType utility usage.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoReturnTypeListeners(context: Readonly<NoReturnTypeContext>): TSESLint.RuleListener {
  return {
    TSTypeReference: checkTypeReference.bind(undefined, context),
  };
}

/**
 * Finds a same-file function declaration or function-valued const by name.
 *
 * @param program - Program node.
 * @param functionName - Function name to find.
 * @returns Function-like node, or null when unavailable.
 */
function findSameFileFunctionDeclaration(
  program: Readonly<TSESTree.Program>,
  functionName: string,
): FunctionLikeNode | null {
  for (const statement of program.body) {
    const functionNode = getTopLevelFunctionNode(statement, functionName);
    if (functionNode !== null) {
      return functionNode;
    }
  }
  return null;
}

/**
 * Returns a named function declaration when it matches the query.
 *
 * @param statement - Program statement to inspect.
 * @param functionName - Function name to match.
 * @returns Function declaration, or null.
 */
function getNamedFunctionDeclaration(
  statement: Readonly<TSESTree.ProgramStatement>,
  functionName: string,
): TSESTree.FunctionDeclaration | null {
  if (statement.type !== AST_NODE_TYPES.FunctionDeclaration) {
    return null;
  }
  return statement.id.name === functionName ? statement : null;
}

/**
 * Returns the function name from ReturnType<typeof fn>.
 *
 * @param node - ReturnType reference node.
 * @returns Function name, or null when the shape is unsupported.
 */
function getReturnTypeFunctionName(node: Readonly<TSESTree.TSTypeReference>): string | null {
  const typeArgument = node.typeArguments?.params[0] ?? null;
  if (!isTypeQueryArgument(typeArgument)) {
    return null;
  }
  return getTypeQueryIdentifierName(typeArgument);
}

/**
 * Returns explicit return type text for a same-file function referenced by ReturnType.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - ReturnType reference node.
 * @returns Return type text, or null when unavailable.
 */
function getSameFileReturnTypeText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSTypeReference>,
): string | null {
  const functionName = getReturnTypeFunctionName(node);
  if (functionName === null) {
    return null;
  }
  const declaration = findSameFileFunctionDeclaration(sourceCode.ast, functionName);
  if (declaration?.returnType === undefined) {
    return null;
  }
  return sourceCode.getText(declaration.returnType.typeAnnotation);
}

/**
 * Returns a matching top-level function node from one statement.
 *
 * @param statement - Program statement.
 * @param functionName - Function name to find.
 * @returns Function-like node, or null when not matched.
 */
function getTopLevelFunctionNode(
  statement: Readonly<TSESTree.ProgramStatement>,
  functionName: string,
): FunctionLikeNode | null {
  const functionDeclaration = getNamedFunctionDeclaration(statement, functionName);
  if (functionDeclaration !== null) {
    return functionDeclaration;
  }
  if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
    return getVariableFunctionNode(statement, functionName);
  }
  return null;
}

/**
 * Returns the identifier name from a typeof query.
 *
 * @param node - Type query node to inspect.
 * @returns Identifier name, or null when unsupported.
 */
function getTypeQueryIdentifierName(node: Readonly<TSESTree.TSTypeQuery>): string | null {
  if (node.exprName.type !== AST_NODE_TYPES.Identifier) {
    return null;
  }
  return node.exprName.name;
}

/**
 * Returns a matching function-valued variable declarator initializer.
 *
 * @param statement - Variable declaration statement.
 * @param functionName - Function name to find.
 * @returns Function-like initializer, or null when not matched.
 */
function getVariableFunctionNode(
  statement: Readonly<TSESTree.VariableDeclaration>,
  functionName: string,
): TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | null {
  for (const declaration of statement.declarations) {
    if (isNamedFunctionVariableDeclarator(declaration, functionName)) {
      return declaration.init;
    }
  }
  return null;
}

/**
 * Returns true when an expression is a function expression.
 *
 * @param node - Expression node.
 * @returns True when the node is function-valued.
 */
function isFunctionExpression(
  node: TSESTree.Expression | null,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  return (
    node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node?.type === AST_NODE_TYPES.FunctionExpression
  );
}

/**
 * Returns true when a variable declarator initializes the named function value.
 *
 * @param declaration - Variable declarator to inspect.
 * @param functionName - Function name to match.
 * @returns True when the declaration matches.
 */
function isNamedFunctionVariableDeclarator(
  declaration: Readonly<TSESTree.VariableDeclarator>,
  functionName: string,
): declaration is TSESTree.VariableDeclarator & {
  id: TSESTree.Identifier;
  init: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
} {
  return (
    declaration.id.type === AST_NODE_TYPES.Identifier &&
    declaration.id.name === functionName &&
    isFunctionExpression(declaration.init)
  );
}

/**
 * Returns true when a type reference targets TypeScript's ReturnType utility.
 *
 * @param node - Type reference node to inspect.
 * @returns Whether the type reference is ReturnType.
 */
function isReturnTypeReference(node: Readonly<TSESTree.TSTypeReference>): boolean {
  return isNamedIdentifierNode(node.typeName, RETURN_TYPE_NAME);
}

/**
 * Returns true when a type argument is a typeof query.
 *
 * @param node - Type node to inspect.
 * @returns True when the node is a type query.
 */
function isTypeQueryArgument(
  node: TSESTree.TypeNode | null,
): node is TSESTree.TSTypeQuery {
  return node?.type === AST_NODE_TYPES.TSTypeQuery;
}

/**
 * Replaces ReturnType with the explicit return type text.
 *
 * @param node - ReturnType reference node.
 * @param returnTypeText - Replacement return type text.
 * @param fixer - ESLint fixer.
 * @returns Generated replacement fix.
 */
function replaceReturnTypeReference(
  node: Readonly<TSESTree.TSTypeReference>,
  returnTypeText: string,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  return fixer.replaceText(node, returnTypeText);
}

/**
 * Reports TypeScript ReturnType utility usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type reference node to report.
 */
function reportReturnType(context: Readonly<NoReturnTypeContext>, node: Readonly<TSESTree.TSTypeReference>): void {
  const suggestions = createExplicitReturnTypeSuggestions(context.sourceCode, node);
  context.report({
    node,
    messageId: NoReturnTypeMessageId.NoReturnType,
    ...(suggestions.length > 0 ? { suggest: suggestions } : {}),
  });
}

/**
 * ESLint rule that disallows TypeScript ReturnType utility usage.
 */
export const noReturnType = createRule({
  name: 'no-return-type',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description: 'Disallow TypeScript ReturnType utility usage',
    },
    messages: {
      noReturnType:
        'ReturnType is not allowed; declare and export an explicit named return contract instead',
      useExplicitReturnType: 'Replace ReturnType with explicit return type "{{type}}".',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoReturnTypeListeners,
});

export default noReturnType;
