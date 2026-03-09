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
import { isBoolean } from '../type-guards';

type NoLiteralUnionsContext = Readonly<TSESLint.RuleContext<'noLiteralUnions', []>>;

const BANNED_LITERAL_NODE_TYPES = new Set([AST_NODE_TYPES.Literal, AST_NODE_TYPES.TemplateLiteral]);
const DECLARE_PREFIX = 'declare ';
const DUPLICATE_SUFFIX_START = 2;
const ENUM_MEMBER_FALLBACK_PREFIX = 'Value';
const EXPORT_PREFIX = 'export ';

/**
 * Checks union types and reports banned literal unions.
 *
 * @param context - ESLint rule execution context.
 * @param node - Union type node to inspect.
 */
function checkUnionType(context: NoLiteralUnionsContext, node: TSESTree.TSUnionType): void {
  if (isBooleanLiteralUnion(node)) {
    return;
  }
  if (!hasBannedLiteralUnionMember(node)) {
    return;
  }
  context.report({
    node,
    messageId: 'noLiteralUnions',
    fix: createLiteralUnionFix(node),
  });
}

/**
 * Builds enum declaration text for one fixable type alias.
 *
 * @param alias - Type alias declaration.
 * @param unionNode - String-literal union node.
 * @param replacementNode - Node replaced by the fixer.
 * @returns Enum declaration source text.
 */
function createEnumDeclarationText(
  alias: TSESTree.TSTypeAliasDeclaration,
  unionNode: TSESTree.TSUnionType,
  replacementNode: TSESTree.Node,
): string {
  const prefix = getEnumDeclarationPrefix(alias, replacementNode);
  const members = createEnumMembersFromUnion(unionNode).join(', ');
  return `${prefix}enum ${alias.id.name} { ${members} }`;
}

/**
 * Creates the base enum member name for one literal value.
 *
 * @param value - String literal value.
 * @param index - 1-based fallback index.
 * @returns Base enum member name.
 */
function createEnumMemberNameBase(value: string, index: number): string {
  const pascalValue = toPascalCase(value);
  if (pascalValue === '') {
    return `${ENUM_MEMBER_FALLBACK_PREFIX}${index}`;
  }
  return startsWithDigit(pascalValue)
    ? `${ENUM_MEMBER_FALLBACK_PREFIX}${pascalValue}`
    : pascalValue;
}

/**
 * Creates enum member declarations from string-literal union members.
 *
 * @param unionNode - String-literal union node.
 * @returns Enum member declarations.
 */
function createEnumMembersFromUnion(unionNode: TSESTree.TSUnionType): string[] {
  const literalMembers = unionNode.types.filter(isStringLiteralTypeNode);
  const names = new Set<string>();
  const members: string[] = [];
  let index = 1;
  for (const unionMember of literalMembers) {
    const value = unionMember.literal.value;
    const memberName = createUniqueEnumMemberName(value, names, index);
    members.push(`${memberName} = ${JSON.stringify(value)}`);
    index += 1;
  }
  return members;
}

/**
 * Creates a fixer for a literal-union node when conversion to enum is safe.
 *
 * @param node - Union type node to inspect.
 * @returns Fix function, or null when no safe fix is available.
 */
function createLiteralUnionFix(node: TSESTree.TSUnionType): TSESLint.ReportFixFunction | null {
  const alias = getDirectTypeAliasDeclaration(node);
  if (alias === null || alias.typeParameters !== undefined) {
    return null;
  }
  if (!isAutofixableStringLiteralUnion(node)) {
    return null;
  }
  const replacementNode = getTypeAliasReplacementNode(alias);
  const replacementText = createEnumDeclarationText(alias, node, replacementNode);
  return replaceWithEnumDeclaration.bind(undefined, replacementNode, replacementText);
}

/**
 * Creates listeners for literal-union checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoLiteralUnionsListeners(context: NoLiteralUnionsContext): TSESLint.RuleListener {
  return {
    TSUnionType: checkUnionType.bind(undefined, context),
  };
}

/**
 * Creates a unique enum member name for a literal value.
 *
 * @param value - String literal value.
 * @param names - Set of already-used enum member names.
 * @param index - 1-based fallback index.
 * @returns Unique enum member name.
 */
function createUniqueEnumMemberName(value: string, names: Set<string>, index: number): string {
  const baseName = createEnumMemberNameBase(value, index);
  let candidateName = baseName;
  let suffix = DUPLICATE_SUFFIX_START;
  while (names.has(candidateName)) {
    candidateName = `${baseName}${suffix}`;
    suffix += 1;
  }
  names.add(candidateName);
  return candidateName;
}

/**
 * Returns type alias declaration when union is directly assigned to it.
 *
 * @param node - Union type node.
 * @returns Direct type alias declaration, or null.
 */
function getDirectTypeAliasDeclaration(
  node: TSESTree.TSUnionType,
): TSESTree.TSTypeAliasDeclaration | null {
  const parentNode = node.parent;
  if (parentNode.type !== AST_NODE_TYPES.TSTypeAliasDeclaration) {
    return null;
  }
  return parentNode.typeAnnotation === node ? parentNode : null;
}

/**
 * Builds the enum declaration prefix for export/declare variants.
 *
 * @param alias - Type alias declaration.
 * @param replacementNode - Node replaced by the fixer.
 * @returns Enum declaration prefix.
 */
function getEnumDeclarationPrefix(
  alias: TSESTree.TSTypeAliasDeclaration,
  replacementNode: TSESTree.Node,
): string {
  const exportPrefix = hasExportPrefix(replacementNode) ? EXPORT_PREFIX : '';
  const declarePrefix = alias.declare ? DECLARE_PREFIX : '';
  return `${exportPrefix}${declarePrefix}`;
}

/**
 * Returns the node to replace for one type alias conversion.
 *
 * @param alias - Type alias declaration.
 * @returns Export wrapper node when present, otherwise alias node.
 */
function getTypeAliasReplacementNode(alias: TSESTree.TSTypeAliasDeclaration): TSESTree.Node {
  const parentNode = alias.parent;
  if (
    parentNode.type === AST_NODE_TYPES.ExportNamedDeclaration &&
    parentNode.declaration === alias
  ) {
    return parentNode;
  }
  return alias;
}

/**
 * Returns true when a union includes any banned literal member.
 *
 * @param node - Union type node to inspect.
 * @returns True when the union should be reported.
 */
function hasBannedLiteralUnionMember(node: TSESTree.TSUnionType): boolean {
  return node.types.some(isBannedLiteralUnionMember);
}

/**
 * Returns true when an alias conversion should include an export prefix.
 *
 * @param replacementNode - Node replaced by the fixer.
 * @returns True when the enum should be exported.
 */
function hasExportPrefix(replacementNode: TSESTree.Node): boolean {
  return replacementNode.type === AST_NODE_TYPES.ExportNamedDeclaration;
}

/**
 * Returns true when runtime value is a non-empty string.
 *
 * @param value - Runtime value to inspect.
 * @returns True when value is a non-empty string.
 */
function isAutofixableStringLiteralUnion(node: TSESTree.TSUnionType): boolean {
  return node.types.length > 0 && node.types.every(isStringLiteralTypeNode);
}

/**
 * Returns true when a literal union member is banned by this rule.
 *
 * @param type - Union member type node.
 * @returns True when the member is a string/number/bigint/template literal.
 */
function isBannedLiteralUnionMember(type: TSESTree.TypeNode): boolean {
  if (!isLiteralTypeNode(type)) {
    return false;
  }
  return BANNED_LITERAL_NODE_TYPES.has(type.literal.type);
}

/**
 * Returns true when a type node represents a boolean literal type.
 *
 * @param type - Type node to inspect.
 * @returns True when the type is a `true`/`false` literal.
 */
function isBooleanLiteralType(type: TSESTree.TypeNode): boolean {
  return (
    isLiteralTypeNode(type) &&
    type.literal.type === AST_NODE_TYPES.Literal &&
    isBoolean(type.literal.value)
  );
}

/**
 * Returns true when all union members are boolean literals.
 *
 * @param node - Union type node to inspect.
 * @returns True for `true | false` style unions.
 */
function isBooleanLiteralUnion(node: TSESTree.TSUnionType): boolean {
  return node.types.every(isBooleanLiteralType);
}

/**
 * Returns true when a type node is a literal type.
 *
 * @param type - Type node to inspect.
 * @returns True when the node is a `TSLiteralType`.
 */
function isLiteralTypeNode(type: TSESTree.TypeNode): type is TSESTree.TSLiteralType {
  return type.type === AST_NODE_TYPES.TSLiteralType;
}

/**
 * Returns true when value is not an empty string.
 *
 * @param value - String segment to inspect.
 * @returns True when segment is non-empty.
 */
function isNonEmptyString(value: string): boolean {
  return value !== '';
}

/**
 * Returns true when literal type node is backed by a string literal.
 *
 * @param type - Type node to inspect.
 * @returns True when type is a string literal type.
 */
function isStringLiteralTypeNode(
  type: TSESTree.TypeNode,
): type is TSESTree.TSLiteralType & { literal: TSESTree.StringLiteral } {
  return (
    isLiteralTypeNode(type) &&
    type.literal.type === AST_NODE_TYPES.Literal &&
    typeof type.literal.value === 'string'
  );
}

/**
 * Replaces the target type alias declaration with enum text.
 *
 * @param replacementNode - Node to replace.
 * @param replacementText - Enum declaration text.
 * @param fixer - ESLint fixer.
 * @returns Text replacement fix.
 */
function replaceWithEnumDeclaration(
  replacementNode: TSESTree.Node,
  replacementText: string,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  return fixer.replaceText(replacementNode, replacementText);
}

/**
 * Returns true when a string starts with a digit.
 *
 * @param value - String value to inspect.
 * @returns True when the first character is numeric.
 */
function startsWithDigit(value: string): boolean {
  return /^\d/u.test(value);
}

/**
 * Converts an arbitrary string into PascalCase identifier text.
 *
 * @param value - String to transform.
 * @returns PascalCase identifier text.
 */
function toPascalCase(value: string): string {
  const spacedValue = value.replace(/([a-z0-9])([A-Z])/gu, '$1 $2');
  const segments = spacedValue.split(/[^A-Za-z0-9]+/u).filter(isNonEmptyString);
  return segments.map(uppercaseFirstCharacter).join('');
}

/**
 * Uppercases only the first character of a string.
 *
 * @param value - String to transform.
 * @returns String with first character uppercased.
 */
function uppercaseFirstCharacter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * ESLint rule that prohibits literal unions in favor of enums.
 */
export const noLiteralUnions = createRule({
  name: 'no-literal-unions',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Ban literal unions in favor of enums',
    },
    messages: {
      noLiteralUnions: 'Literal unions are not allowed, use an enum instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoLiteralUnionsListeners,
});

export default noLiteralUnions;
