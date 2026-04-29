/* istanbul ignore file */

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

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

const ADD_OPERATOR = '+';
const DOT_SEPARATOR = '.';

/**
 * Gets a static callee name from an identifier or member expression.
 *
 * @param callee - Call expression callee to inspect.
 * @returns The static callee name when one is available.
 */
export function getCalleeName(callee: Readonly<TSESTree.Expression>): string | null {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }
  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    return getPropertyName(callee.property);
  }
  return null;
}

/**
 * Gets a dotted member path from a member expression.
 *
 * @param node - Expression to inspect.
 * @returns The dotted path when the expression is a static member expression.
 */
function getMemberExpressionPath(node: Readonly<TSESTree.Expression>): string | null {
  if (node.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }
  return joinMemberPath(getMemberPath(node.object), getPropertyName(node.property));
}

/**
 * Gets a dotted member path from identifiers and simple member expressions.
 *
 * @param node - Expression to inspect.
 * @returns The dotted member path when it is statically known.
 */
export function getMemberPath(node: Readonly<TSESTree.Expression>): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  return getMemberExpressionPath(node);
}

/**
 * Gets a static object property name from an AST property node.
 *
 * @param property - Property node to inspect.
 * @returns The property name when it is statically known.
 */
export function getPropertyName(
  property: TSESTree.Expression | TSESTree.PrivateIdentifier,
): string | null {
  if (property.type === AST_NODE_TYPES.Identifier) {
    return property.name;
  }
  if (property.type === AST_NODE_TYPES.Literal && typeof property.value === 'string') {
    return property.value;
  }
  return null;
}

/**
 * Gets a plain string value from a literal or expression-free template.
 *
 * @param node - Expression to inspect.
 * @returns The string value when the expression is static.
 */
export function getStaticString(node: Readonly<TSESTree.Expression>): string | null {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }
  return getStaticTemplateString(node);
}

/**
 * Gets a static string from an expression-free template.
 *
 * @param node - Expression to inspect.
 * @returns Template text when the expression is static.
 */
function getStaticTemplateString(node: Readonly<TSESTree.Expression>): string | null {
  if (node.type !== AST_NODE_TYPES.TemplateLiteral || node.expressions.length > 0) {
    return null;
  }
  return node.quasis.map(getTemplateElementText).join('');
}

/**
 * Gets the cooked or raw text from a template element.
 *
 * @param element - Template element to inspect.
 * @returns The static element text.
 */
function getTemplateElementText(element: Readonly<TSESTree.TemplateElement>): string {
  return element.value.cooked ?? element.value.raw;
}

/**
 * Returns true when any object property has an accepted name.
 *
 * @param properties - Object properties to inspect.
 * @param names - Accepted property names.
 * @returns True when a matching property is present.
 */
function hasNamedProperty(
  properties: readonly (TSESTree.Property | TSESTree.SpreadElement)[],
  names: Readonly<ReadonlySet<string>>,
): boolean {
  for (const property of properties) {
    if (hasPropertyName(property, names)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when an object expression has a named property.
 *
 * @param node - Expression to inspect.
 * @param names - Accepted property names.
 * @returns True when a matching property is present.
 */
export function hasObjectProperty(
  node: TSESTree.Expression | TSESTree.SpreadElement | undefined,
  names: Readonly<ReadonlySet<string>>,
): boolean {
  if (node?.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }
  return hasNamedProperty(node.properties, names);
}

/**
 * Returns true when an object property matches one of the requested names.
 *
 * @param property - Object property to inspect.
 * @param names - Accepted property names.
 * @returns True when the property name matches.
 */
function hasPropertyName(
  property: TSESTree.Property | TSESTree.SpreadElement,
  names: Readonly<ReadonlySet<string>>,
): boolean {
  if (property.type !== AST_NODE_TYPES.Property) {
    return false;
  }
  const name = getPropertyName(property.key);
  return name !== null && names.has(name);
}

/**
 * Checks whether an expression contains any string-like branch.
 *
 * @param left - Left expression or private identifier to inspect.
 * @param right - Right expression or private identifier to inspect.
 * @returns True when a string literal or template appears.
 */
function hasStringLikeBranch(
  left: TSESTree.Expression | TSESTree.PrivateIdentifier,
  right: TSESTree.Expression | TSESTree.PrivateIdentifier,
): boolean {
  return isStringLikeExpression(left) || isStringLikeExpression(right);
}

/**
 * Returns true when any object property is true for the requested name.
 *
 * @param properties - Object properties to inspect.
 * @param name - Property name to match.
 * @returns True when a true property is present.
 */
function hasTrueNamedProperty(
  properties: readonly (TSESTree.Property | TSESTree.SpreadElement)[],
  name: string,
): boolean {
  for (const property of properties) {
    if (isTrueProperty(property, name)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when an object expression property is exactly `true`.
 *
 * @param node - Expression to inspect.
 * @param name - Property name to match.
 * @returns True when the named property has a true literal value.
 */
export function hasTrueObjectProperty(
  node: TSESTree.Expression | TSESTree.SpreadElement | undefined,
  name: string,
): boolean {
  if (node?.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }
  return hasTrueNamedProperty(node.properties, name);
}

/**
 * Returns true when an expression constructs a command or query string dynamically.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is interpolated or concatenated.
 */
export function isDynamicString(node: Readonly<TSESTree.Expression>): boolean {
  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    return node.expressions.length > 0;
  }
  return isDynamicStringBinary(node);
}

/**
 * Returns true when a binary expression constructs a string dynamically.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is a string concatenation.
 */
function isDynamicStringBinary(node: Readonly<TSESTree.Expression>): boolean {
  if (node.type !== AST_NODE_TYPES.BinaryExpression) {
    return false;
  }
  return node.operator === ADD_OPERATOR && hasStringLikeBranch(node.left, node.right);
}

/**
 * Checks one non-private expression branch for string-like content.
 *
 * @param node - Expression to inspect.
 * @returns True when a string literal or template appears.
 */
function isNonPrivateStringLikeExpression(node: Readonly<TSESTree.Expression>): boolean {
  if (!isStringBoundary(node)) {
    return false;
  }
  if (node.type !== AST_NODE_TYPES.BinaryExpression) {
    return true;
  }
  return hasStringLikeBranch(node.left, node.right);
}

/**
 * Returns true when an expression is the null literal.
 *
 * @param node - Expression to inspect.
 * @returns True when the node represents null.
 */
export function isNullLiteral(node: TSESTree.Expression | null): boolean {
  return node?.type === AST_NODE_TYPES.Literal && node.value === null;
}

/**
 * Returns true when an expression is string-like or can contain string-like branches.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is relevant to string construction.
 */
function isStringBoundary(node: Readonly<TSESTree.Expression>): boolean {
  return node.type === AST_NODE_TYPES.TemplateLiteral ||
    isStringLiteral(node) ||
    node.type === AST_NODE_TYPES.BinaryExpression;
}

/**
 * Checks one expression branch for string-like content.
 *
 * @param node - Expression or private identifier to inspect.
 * @returns True when a string literal or template appears.
 */
function isStringLikeExpression(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  if (node.type === AST_NODE_TYPES.PrivateIdentifier) {
    return false;
  }
  return isNonPrivateStringLikeExpression(node);
}

/**
 * Returns true when an expression is a string literal.
 *
 * @param node - Expression to inspect.
 * @returns True when the node is a string literal.
 */
export function isStringLiteral(node: TSESTree.Expression | null): node is TSESTree.StringLiteral {
  return node?.type === AST_NODE_TYPES.Literal && typeof node.value === 'string';
}

/**
 * Returns true when an object property has a true literal value.
 *
 * @param property - Object property to inspect.
 * @param name - Property name to match.
 * @returns True when the property matches and is true.
 */
function isTrueProperty(property: TSESTree.Property | TSESTree.SpreadElement, name: string): boolean {
  if (property.type !== AST_NODE_TYPES.Property || getPropertyName(property.key) !== name) {
    return false;
  }
  return property.value.type === AST_NODE_TYPES.Literal && Boolean(property.value.value);
}

/**
 * Joins member path components when both are known.
 *
 * @param objectPath - Static object path.
 * @param propertyName - Static property name.
 * @returns Joined member path.
 */
function joinMemberPath(objectPath: string | null, propertyName: string | null): string | null {
  return objectPath === null || propertyName === null
    ? null
    : `${objectPath}${DOT_SEPARATOR}${propertyName}`;
}
