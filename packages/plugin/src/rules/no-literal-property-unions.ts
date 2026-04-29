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
import { isBoolean, isNumber, isString } from '../helpers/type-guards';
import { createRule } from './support/rule-factory';

type NoLiteralPropertyUnionsContext = Readonly<TSESLint.RuleContext<'noLiteralPropertyUnions', []>>;

type PropertyNode =
  | TSESTree.PropertyDefinition
  | TSESTree.TSAbstractPropertyDefinition
  | TSESTree.TSPropertySignature;

const NEGATIVE_NUMBER_OPERATOR = '-';

/**
 * Checks one property declaration for literal unions.
 *
 * @param context - ESLint rule execution context.
 * @param node - Property-like node to inspect.
 */
function checkPropertyNode(context: Readonly<NoLiteralPropertyUnionsContext>, node: Readonly<PropertyNode>): void {
  const typeNode = getPropertyTypeNode(node);
  if (typeNode === null || !isLiteralPropertyUnion(typeNode)) {
    return;
  }
  context.report({
    node: node.key,
    messageId: 'noLiteralPropertyUnions',
    data: {
      name: getPropertyName(context.sourceCode, node),
    },
  });
}

/**
 * Creates listeners for property literal-union checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoLiteralPropertyUnionsListeners(
  context: Readonly<NoLiteralPropertyUnionsContext>,
): TSESLint.RuleListener {
  return {
    PropertyDefinition: checkPropertyNode.bind(undefined, context),
    TSAbstractPropertyDefinition: checkPropertyNode.bind(undefined, context),
    TSPropertySignature: checkPropertyNode.bind(undefined, context),
  };
}

/**
 * Returns a stable display name for a reported property.
 *
 * @param sourceCode - ESLint source helper.
 * @param node - Property-like node to inspect.
 * @returns Property name text.
 */
function getPropertyName(sourceCode: Readonly<TSESLint.SourceCode>, node: Readonly<PropertyNode>): string {
  const propertyName = getUncomputedPropertyName(node.key, node.computed);
  return propertyName ?? sourceCode.getText(node.key);
}

/**
 * Returns the type node declared by a property, if present.
 *
 * @param node - Property-like node to inspect.
 * @returns Declared property type node, or null.
 */
function getPropertyTypeNode(node: Readonly<PropertyNode>): TSESTree.TypeNode | null {
  return node.typeAnnotation?.typeAnnotation ?? null;
}

/**
 * Returns the display name for an uncomputed property key.
 *
 * @param key - Property key to inspect.
 * @param computed - Whether the key is computed.
 * @returns Property name for simple keys, or null.
 */
function getUncomputedPropertyName(key: Readonly<TSESTree.PropertyName>, computed: boolean): string | null {
  if (computed) {
    return null;
  }
  return getUncomputedPropertyNameFromKey(key);
}

/**
 * Returns the display name for a simple property key.
 *
 * @param key - Uncomputed property key to inspect.
 * @returns Property name for identifiers and literals, or null.
 */
function getUncomputedPropertyNameFromKey(key: Readonly<TSESTree.PropertyName>): string | null {
  if (key.type === AST_NODE_TYPES.Identifier) {
    return key.name;
  }
  if (key.type === AST_NODE_TYPES.Literal) {
    return String(key.value);
  }
  return null;
}

/**
 * Returns true when any union member should be reported.
 *
 * @param members - Union members to inspect.
 * @returns True when the union includes a banned literal member.
 */
function hasBannedLiteralUnionMember(members: readonly TSESTree.TypeNode[]): boolean {
  for (const member of members) {
    if (isBannedLiteralTypeNode(member)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a node is a reportable literal expression.
 *
 * @param node - Literal node to inspect.
 * @returns True when the literal should be reported.
 */
function isBannedLiteralNode(node: Readonly<TSESTree.Node>): boolean {
  return (
    isBannedPrimitiveLiteralNode(node) ||
    node.type === AST_NODE_TYPES.TemplateLiteral ||
    isNegativeNumberLiteralNode(node)
  );
}

/**
 * Returns true when a type node is a reportable literal type.
 *
 * @param node - Type node to inspect.
 * @returns True when the type member is a literal property value.
 */
function isBannedLiteralTypeNode(node: Readonly<TSESTree.TypeNode>): boolean {
  if (node.type === AST_NODE_TYPES.TSTemplateLiteralType) {
    return true;
  }
  if (node.type !== AST_NODE_TYPES.TSLiteralType) {
    return false;
  }
  return isBannedLiteralNode(node.literal);
}

/**
 * Returns true when a primitive literal value should be reported.
 *
 * @param value - Primitive literal value to inspect.
 * @returns True for string, number, and boolean literal values.
 */
function isBannedLiteralValue(value: boolean | bigint | number | RegExp | string | null): boolean {
  return isString(value) || isNumber(value) || isBoolean(value);
}

/**
 * Returns true when a node is a reportable primitive literal.
 *
 * @param node - Node to inspect.
 * @returns True for string, number, and boolean literals.
 */
function isBannedPrimitiveLiteralNode(node: Readonly<TSESTree.Node>): boolean {
  return node.type === AST_NODE_TYPES.Literal && isBannedLiteralValue(node.value);
}

/**
 * Returns true when a type node is a boolean literal type.
 *
 * @param node - Type node to inspect.
 * @returns True when the type member is true or false.
 */
function isBooleanLiteralTypeNode(node: Readonly<TSESTree.TypeNode>): boolean {
  return (
    node.type === AST_NODE_TYPES.TSLiteralType &&
    node.literal.type === AST_NODE_TYPES.Literal &&
    isBoolean(node.literal.value)
  );
}

/**
 * Returns true when every member is a boolean literal type.
 *
 * @param members - Union members to inspect.
 * @returns True when the union represents the full boolean domain.
 */
function isBooleanLiteralUnion(members: readonly TSESTree.TypeNode[]): boolean {
  for (const member of members) {
    if (!isBooleanLiteralTypeNode(member)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true when a union contains banned literal property members.
 *
 * @param node - Type node to inspect.
 * @returns True when the property union should be reported.
 */
function isLiteralPropertyUnion(node: Readonly<TSESTree.TypeNode>): boolean {
  if (node.type !== AST_NODE_TYPES.TSUnionType) {
    return false;
  }
  return !isBooleanLiteralUnion(node.types) && hasBannedLiteralUnionMember(node.types);
}

/**
 * Returns true when an expression is a unary negative numeric literal.
 *
 * @param node - Node to inspect.
 * @returns True when the node is `-<number>`.
 */
function isNegativeNumberLiteralNode(node: Readonly<TSESTree.Node>): node is TSESTree.UnaryExpression & {
  argument: TSESTree.NumberLiteral;
  operator: typeof NEGATIVE_NUMBER_OPERATOR;
} {
  return (
    node.type === AST_NODE_TYPES.UnaryExpression &&
    node.operator === NEGATIVE_NUMBER_OPERATOR &&
    node.argument.type === AST_NODE_TYPES.Literal &&
    isNumber(node.argument.value)
  );
}

/**
 * ESLint rule that requires property literal unions to be represented by named domain types.
 */
export const noLiteralPropertyUnions = createRule({
  name: 'no-literal-property-unions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require property literal unions to use named domain types',
    },
    messages: {
      noLiteralPropertyUnions:
        'Property "{{name}}" defines literal union values. Extract the domain to a named type; prefer enums for string or number domains.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoLiteralPropertyUnionsListeners,
});

export default noLiteralPropertyUnions;
