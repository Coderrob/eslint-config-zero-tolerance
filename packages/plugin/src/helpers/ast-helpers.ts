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

/**
 * Reusable AST helper functions shared across multiple rule implementations.
 */

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ANONYMOUS_FUNCTION_NAME } from '../constants';
import {
  type FunctionNode,
  isFunctionDeclarationNode,
  isIdentifierNode,
  isMethodDefinitionNode,
  isNodeLike,
  isVariableDeclaratorNode,
} from './ast-guards';
import { isPlainObject, isString } from './type-guards';

/**
 * Returns the member method name for a call expression, or null.
 *
 * @param node - Call expression node.
 * @returns Method name when callee is a member expression.
 */
export function getCallMemberMethodName(node: TSESTree.CallExpression): string | null {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }
  return getMemberPropertyName(node.callee);
}

/**
 * Returns the property name for bracket-notation (computed) member access
 * when the computed key is a string literal.
 *
 * @param property - The computed property node to inspect.
 * @returns The property name if it is a string literal, otherwise null.
 */
function getComputedPropertyName(property: { type: string; value?: unknown }): string | null {
  return isString(property.value) ? property.value : null;
}

/**
 * Returns the name from a named FunctionDeclaration.
 *
 * @param node - The function node to check.
 * @returns The declaration name if available, otherwise null.
 */
export function getFunctionDeclarationName(node: FunctionNode): string | null {
  if (!isFunctionDeclarationNode(node)) {
    return null;
  }
  return getIdentifierName(node.id);
}

/**
 * Returns the method key name when the function is inside a MethodDefinition.
 *
 * @param node - The function node to check.
 * @returns The method name if available, otherwise null.
 */
export function getFunctionMethodName(node: FunctionNode): string | null {
  if (!isMethodDefinitionNode(node.parent)) {
    return null;
  }
  return getIdentifierName(node.parent.key);
}

/**
 * Returns the variable name when the function is the initializer of a VariableDeclarator.
 *
 * @param node - The function node to check.
 * @returns The variable name if available, otherwise null.
 */
export function getFunctionVariableName(node: FunctionNode): string | null {
  if (!isVariableDeclaratorNode(node.parent)) {
    return null;
  }
  return getIdentifierName(node.parent.id);
}

/**
 * Returns the identifier name when the node is an Identifier, otherwise null.
 *
 * @param node - The node to extract the name from.
 * @returns The identifier name if available, null otherwise.
 */
export function getIdentifierName(node: TSESTree.Node | null | undefined): string | null {
  if (!isIdentifierNode(node)) {
    return null;
  }
  return node.name;
}

/**
 * Returns the string value for a Literal node, or null.
 *
 * @param node - The node to inspect.
 * @returns The literal string value when available, otherwise null.
 */
export function getLiteralStringValue(
  node: { type: string; value?: unknown } | null | undefined,
): string | null {
  return node?.type === AST_NODE_TYPES.Literal && isString(node.value) ? node.value : null;
}

/**
 * Returns a mapped replacement for a member property when the property name
 * exists in the provided replacement map.
 *
 * @param node - Member expression-like node to inspect.
 * @param replacements - Lookup map of banned member names to replacements.
 * @returns The matched name and replacement, or null when no match exists.
 */
export function getMappedMemberPropertyName(
  node: {
    computed: boolean;
    property: { type: string; name?: string; value?: unknown };
  },
  replacements: Readonly<Record<string, string | undefined>>,
): { name: string; replacement: string } | null {
  const name = getMemberPropertyName(node);
  if (name === null) {
    return null;
  }
  const replacement = replacements[name];
  if (replacement === undefined) {
    return null;
  }
  return { name, replacement };
}

/**
 * Extracts the property name from a member expression for both dot and
 * string-computed access patterns.
 *
 * @param node - Member expression-like node to inspect.
 * @returns The property name if available, otherwise null.
 */
export function getMemberPropertyName(node: {
  computed: boolean;
  property: { type: string; name?: string; value?: unknown };
}): string | null {
  if (!node.computed) {
    return getNonComputedPropertyName(node.property);
  }
  return getComputedPropertyName(node.property);
}

/**
 * Returns the property name for dot-notation (non-computed) member access.
 *
 * @param property - The property node.
 * @returns The property name if it's an identifier, otherwise null.
 */
function getNonComputedPropertyName(property: { type: string; name?: string }): string | null {
  return isString(property.name) ? property.name : null;
}

/**
 * Reads the `max` property from an option object.
 *
 * @param option - First rule option value.
 * @returns The raw max value when present, otherwise undefined.
 */
export function getOptionMaxValue(option: unknown): unknown {
  if (!isPlainObject(option)) {
    return undefined;
  }
  return Reflect.get(option, 'max');
}

/**
 * Returns child nodes extracted from one visitor-key value.
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
 * Missing visitor keys are treated as an empty traversal set so callers can
 * safely walk custom or unsupported node types without runtime errors.
 *
 * @param node - Node whose children should be collected.
 * @param sourceCode - ESLint source code helper.
 * @returns Child nodes for traversal.
 */
export function getVisitorChildNodes(
  node: TSESTree.Node,
  sourceCode: Pick<TSESLint.SourceCode, 'visitorKeys'>,
): ReadonlyArray<TSESTree.Node> {
  const childNodes: TSESTree.Node[] = [];
  const visitorKeys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of visitorKeys) {
    childNodes.push(...getVisitorArrayNodes(Reflect.get(node, key)));
  }
  return childNodes;
}

/**
 * Resolves the most descriptive function name available for diagnostics,
 * falling back to the anonymous sentinel when no name can be inferred.
 *
 * @param node - The function node to resolve the name for.
 * @returns The resolved function name.
 */
export function resolveFunctionName(node: FunctionNode): string {
  const names = [
    getFunctionDeclarationName(node),
    getFunctionVariableName(node),
    getFunctionMethodName(node),
  ];
  for (const name of names) {
    if (name !== null) {
      return name;
    }
  }
  return ANONYMOUS_FUNCTION_NAME;
}
