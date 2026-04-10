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
import { unwrapTsExpression } from '../helpers/ast/types';
import { isBoolean, isNumber, isString } from '../helpers/type-guards';
import { VARIABLE_KIND_CONST } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type NoLiteralUnionsContext = Readonly<TSESLint.RuleContext<'noLiteralUnions', []>>;

interface IResolvedConstLiteral {
  kind: ResolvedLiteralKind;
  memberName: string;
  value: boolean | number | string;
}

interface IResolvedStringUnionMember {
  preferredMemberName: string | null;
  value: string;
}

enum ResolvedLiteralKind {
  Boolean = 'boolean',
  Number = 'number',
  String = 'string',
}

const BANNED_LITERAL_NODE_TYPES = new Set([AST_NODE_TYPES.Literal, AST_NODE_TYPES.TemplateLiteral]);
const DECLARE_PREFIX = 'declare ';
const DUPLICATE_SUFFIX_START = 2;
const ENUM_MEMBER_FALLBACK_PREFIX = 'Value';
const EXPORT_PREFIX = 'export ';
const NEGATIVE_NUMBER_OPERATOR = '-';

/**
 * Adds resolved const-literal declarations from one declaration node.
 *
 * @param declarations - Accumulated resolved declarations.
 * @param declaration - Variable declaration to inspect.
 */
function addConstLiteralDeclarations(
  declarations: Map<string, IResolvedConstLiteral>,
  declaration: TSESTree.VariableDeclaration,
): void {
  if (declaration.kind !== VARIABLE_KIND_CONST) {
    return;
  }
  for (const declarator of declaration.declarations) {
    const resolvedLiteral = getResolvedConstDeclaratorLiteral(declarator);
    if (resolvedLiteral !== null) {
      declarations.set(resolvedLiteral.memberName, resolvedLiteral);
    }
  }
}

/**
 * Checks union types and reports banned literal unions.
 *
 * @param context - ESLint rule execution context.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @param node - Union type node to inspect.
 */
function checkUnionType(
  context: NoLiteralUnionsContext,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
  node: TSESTree.TSUnionType,
): void {
  if (isDirectPropertyTypeAnnotationUnion(node) || isBooleanLiteralUnion(node, constLiteralMap)) {
    return;
  }
  if (!hasBannedLiteralUnionMember(node, constLiteralMap)) {
    return;
  }
  context.report({
    node,
    messageId: 'noLiteralUnions',
    fix: createLiteralUnionFix(node, constLiteralMap),
  });
}

/**
 * Builds enum declaration text for one fixable type alias.
 *
 * @param alias - Type alias declaration.
 * @param unionNode - String-literal union node.
 * @param replacementNode - Node replaced by the fixer.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns Enum declaration source text.
 */
function createEnumDeclarationText(
  alias: TSESTree.TSTypeAliasDeclaration,
  unionNode: TSESTree.TSUnionType,
  replacementNode: TSESTree.Node,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): string {
  const prefix = getEnumDeclarationPrefix(alias, replacementNode);
  const members = createEnumMembersFromUnion(unionNode, constLiteralMap).join(', ');
  return `${prefix}enum ${alias.id.name} { ${members} }`;
}

/**
 * Creates one enum member declaration from a resolved string-union member.
 *
 * @param names - Set of already-used enum member names.
 * @param unionMember - Resolved string-union member.
 * @param index - 1-based fallback index.
 * @returns Enum member declaration text.
 */
function createEnumMemberDeclaration(
  names: Set<string>,
  unionMember: IResolvedStringUnionMember,
  index: number,
): string {
  const memberName = createUniqueStringEnumMemberName(
    unionMember.preferredMemberName,
    unionMember.value,
    names,
    index,
  );
  return `${memberName} = ${JSON.stringify(unionMember.value)}`;
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
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns Enum member declarations.
 */
function createEnumMembersFromUnion(
  unionNode: TSESTree.TSUnionType,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): string[] {
  const members: string[] = [];
  const names = new Set<string>();
  let index = 1;
  for (const unionMember of getResolvedStringUnionMembers(unionNode, constLiteralMap)) {
    members.push(createEnumMemberDeclaration(names, unionMember, index));
    index += 1;
  }
  return members;
}

/**
 * Creates a fixer for a literal-union node when conversion to enum is safe.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns Fix function, or null when no safe fix is available.
 */
function createLiteralUnionFix(
  node: TSESTree.TSUnionType,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): TSESLint.ReportFixFunction | null {
  const alias = getDirectTypeAliasDeclaration(node);
  if (alias === null || alias.typeParameters !== undefined) {
    return null;
  }
  if (!isAutofixableStringLiteralUnion(node, constLiteralMap)) {
    return null;
  }
  const replacementNode = getTypeAliasReplacementNode(alias);
  const replacementText = createEnumDeclarationText(alias, node, replacementNode, constLiteralMap);
  return replaceWithEnumDeclaration.bind(undefined, replacementNode, replacementText);
}

/**
 * Creates listeners for literal-union checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoLiteralUnionsListeners(context: NoLiteralUnionsContext): TSESLint.RuleListener {
  const constLiteralMap = getConstLiteralDeclarations(context.sourceCode.ast.body);
  return {
    TSUnionType: checkUnionType.bind(undefined, context, constLiteralMap),
  };
}

/**
 * Creates a unique enum member name from one base identifier.
 *
 * @param baseName - Candidate base member name.
 * @param names - Set of already-used enum member names.
 * @returns Unique enum member name.
 */
function createUniqueMemberName(baseName: string, names: Set<string>): string {
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
 * Creates a unique enum member name for one string-union entry.
 *
 * @param preferredMemberName - Preferred member name from a referenced const, when present.
 * @param value - String literal value.
 * @param names - Set of already-used enum member names.
 * @param index - 1-based fallback index.
 * @returns Unique enum member name.
 */
function createUniqueStringEnumMemberName(
  preferredMemberName: string | null,
  value: string,
  names: Set<string>,
  index: number,
): string {
  const baseName = preferredMemberName ?? createEnumMemberNameBase(value, index);
  return createUniqueMemberName(baseName, names);
}

/**
 * Returns resolved literal-valued const declarations from the module body.
 *
 * @param body - Program body nodes to inspect.
 * @returns Map of const identifiers to resolved literal values.
 */
function getConstLiteralDeclarations(
  body: ReadonlyArray<TSESTree.ProgramStatement>,
): ReadonlyMap<string, IResolvedConstLiteral> {
  const declarations = new Map<string, IResolvedConstLiteral>();
  for (const statement of body) {
    const declaration = getConstLiteralDeclarationsFromStatement(statement);
    if (declaration !== null) {
      addConstLiteralDeclarations(declarations, declaration);
    }
  }
  return declarations;
}

/**
 * Returns one declaration node when a statement can contain const literals.
 *
 * @param statement - Program statement to inspect.
 * @returns Variable declaration to inspect, or null.
 */
function getConstLiteralDeclarationsFromStatement(
  statement: TSESTree.ProgramStatement,
): TSESTree.VariableDeclaration | null {
  if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
    return statement;
  }
  if (isExportedVariableDeclarationStatement(statement)) {
    return statement.declaration;
  }
  return null;
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
  return parentNode;
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
 * Returns resolved literal metadata for one const declarator.
 *
 * @param declarator - Variable declarator to inspect.
 * @returns Resolved literal metadata, or null.
 */
function getResolvedConstDeclaratorLiteral(
  declarator: TSESTree.VariableDeclarator,
): IResolvedConstLiteral | null {
  if (declarator.id.type !== AST_NODE_TYPES.Identifier || declarator.init === null) {
    return null;
  }
  const resolvedLiteral = resolveLiteralExpressionValue(declarator.init);
  if (resolvedLiteral === null) {
    return null;
  }
  return {
    ...resolvedLiteral,
    memberName: declarator.id.name,
  };
}

/**
 * Returns resolved const-literal metadata for a type-query node.
 *
 * @param type - Type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns Resolved const-literal metadata, or null.
 */
function getResolvedConstLiteral(
  type: TSESTree.TypeNode,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): IResolvedConstLiteral | null {
  if (
    type.type !== AST_NODE_TYPES.TSTypeQuery ||
    type.exprName.type !== AST_NODE_TYPES.Identifier
  ) {
    return null;
  }
  return constLiteralMap.get(type.exprName.name) ?? null;
}

/**
 * Returns one fixable string-union member from a literal or const reference.
 *
 * @param type - Union member type node.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns Fixable string-union member, or null.
 */
function getResolvedStringUnionMember(
  type: TSESTree.TypeNode,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): IResolvedStringUnionMember | null {
  const directStringLiteral = getResolvedStringUnionMemberFromLiteral(type);
  if (directStringLiteral !== null) {
    return directStringLiteral;
  }
  return getResolvedStringUnionMemberFromReference(type, constLiteralMap);
}

/**
 * Returns one resolved string-union member from a direct literal type.
 *
 * @param type - Type node to inspect.
 * @returns Resolved string-union member, or null.
 */
function getResolvedStringUnionMemberFromLiteral(
  type: TSESTree.TypeNode,
): IResolvedStringUnionMember | null {
  if (!isStringLiteralTypeNode(type)) {
    return null;
  }
  return {
    preferredMemberName: null,
    value: type.literal.value,
  };
}

/**
 * Returns one resolved string-union member from a const-reference type.
 *
 * @param type - Type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns Resolved string-union member, or null.
 */
function getResolvedStringUnionMemberFromReference(
  type: TSESTree.TypeNode,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): IResolvedStringUnionMember | null {
  const resolvedLiteral = getResolvedConstLiteral(type, constLiteralMap);
  if (!isResolvedStringConstLiteral(resolvedLiteral)) {
    return null;
  }
  return {
    preferredMemberName: resolvedLiteral.memberName,
    value: resolvedLiteral.value,
  };
}

/**
 * Returns fixable string-union members resolved from literals and const references.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns Fixable string-union members.
 */
function getResolvedStringUnionMembers(
  node: TSESTree.TSUnionType,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): IResolvedStringUnionMember[] {
  const members: IResolvedStringUnionMember[] = [];
  for (const unionMember of node.types) {
    const resolvedMember = getResolvedStringUnionMember(unionMember, constLiteralMap);
    if (resolvedMember === null) {
      return [];
    }
    members.push(resolvedMember);
  }
  return members;
}

/**
 * Returns the cooked string value from a no-substitution template literal.
 *
 * @param expression - Template literal to inspect.
 * @returns Cooked string value, or null when unavailable.
 */
function getTemplateLiteralCookedValue(expression: TSESTree.TemplateLiteral): string | null {
  return expression.quasis[0].value.cooked;
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
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the union should be reported.
 */
function hasBannedLiteralUnionMember(
  node: TSESTree.TSUnionType,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): boolean {
  return (
    hasDirectLiteralUnionMember(node) || hasLiteralConstReferenceUnionMember(node, constLiteralMap)
  );
}

/**
 * Returns true when a type query resolves to a const literal of the expected kind.
 *
 * @param type - Type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @param expectedKind - Expected literal kind.
 * @returns True when the type query resolves to a matching literal kind.
 */
function hasConstLiteralReferenceKind(
  type: TSESTree.TypeNode,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
  expectedKind: ResolvedLiteralKind,
): boolean {
  const resolvedLiteral = getResolvedConstLiteral(type, constLiteralMap);
  return isResolvedConstLiteralKind(resolvedLiteral, expectedKind);
}

/**
 * Returns true when any union member is a direct banned literal type.
 *
 * @param node - Union type node to inspect.
 * @returns True when a direct literal member should be reported.
 */
function hasDirectLiteralUnionMember(node: TSESTree.TSUnionType): boolean {
  for (const unionMember of node.types) {
    if (isLiteralTypeNode(unionMember) && BANNED_LITERAL_NODE_TYPES.has(unionMember.literal.type)) {
      return true;
    }
  }
  return false;
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
 * Returns true when any union member is a const-reference literal in a type alias.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the type alias includes a literal const reference.
 */
function hasLiteralConstReferenceUnionMember(
  node: TSESTree.TSUnionType,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): boolean {
  if (!isTypeAliasUnion(node)) {
    return false;
  }
  for (const unionMember of node.types) {
    if (isLiteralConstReferenceType(unionMember, constLiteralMap)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when every union member can be converted into a string enum member.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the union is autofixable to a string enum.
 */
function isAutofixableStringLiteralUnion(
  node: TSESTree.TSUnionType,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): boolean {
  return getResolvedStringUnionMembers(node, constLiteralMap).length === node.types.length;
}

/**
 * Returns true when a type node represents a boolean literal type.
 *
 * @param type - Type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the type is a `true`/`false` literal or boolean-literal const reference.
 */
function isBooleanLiteralType(
  type: TSESTree.TypeNode,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): boolean {
  return (
    isDirectBooleanLiteralType(type) ||
    hasConstLiteralReferenceKind(type, constLiteralMap, ResolvedLiteralKind.Boolean)
  );
}

/**
 * Returns true when all union members are boolean literals.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True for `true | false` style unions.
 */
function isBooleanLiteralUnion(
  node: TSESTree.TSUnionType,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): boolean {
  for (const unionMember of node.types) {
    if (!isBooleanLiteralType(unionMember, constLiteralMap)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true when a type node is a direct boolean literal type.
 *
 * @param type - Type node to inspect.
 * @returns True when the type is a direct `true` or `false` literal.
 */
function isDirectBooleanLiteralType(type: TSESTree.TypeNode): boolean {
  return (
    isLiteralTypeNode(type) &&
    type.literal.type === AST_NODE_TYPES.Literal &&
    isBoolean(type.literal.value)
  );
}

/**
 * Returns true when a union is the direct annotation of a property-like node.
 *
 * @param node - Union type node to inspect.
 * @returns True when the new property-specific rule owns the report.
 */
function isDirectPropertyTypeAnnotationUnion(node: TSESTree.TSUnionType): boolean {
  const parentNode = node.parent;
  if (parentNode.type !== AST_NODE_TYPES.TSTypeAnnotation) {
    return false;
  }
  const annotatedNode = parentNode.parent;
  return (
    annotatedNode.type === AST_NODE_TYPES.PropertyDefinition ||
    annotatedNode.type === AST_NODE_TYPES.TSAbstractPropertyDefinition ||
    annotatedNode.type === AST_NODE_TYPES.TSPropertySignature
  );
}

/**
 * Returns true when a statement directly exports a variable declaration.
 *
 * @param statement - Program statement to inspect.
 * @returns True when the statement exports a variable declaration.
 */
function isExportedVariableDeclarationStatement(
  statement: TSESTree.ProgramStatement,
): statement is TSESTree.ExportNamedDeclaration & {
  declaration: TSESTree.VariableDeclaration;
} {
  return (
    statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
    statement.declaration?.type === AST_NODE_TYPES.VariableDeclaration
  );
}

/**
 * Returns true when a type node references a literal-valued const declaration.
 *
 * @param type - Type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the type query resolves to a literal-valued const.
 */
function isLiteralConstReferenceType(
  type: TSESTree.TypeNode,
  constLiteralMap: ReadonlyMap<string, IResolvedConstLiteral>,
): boolean {
  return getResolvedConstLiteral(type, constLiteralMap) !== null;
}

/**
 * Returns true when a type node represents a literal type.
 *
 * @param type - Type node to inspect.
 * @returns True when the node is a `TSLiteralType`.
 */
function isLiteralTypeNode(type: TSESTree.TypeNode): type is TSESTree.TSLiteralType {
  return type.type === AST_NODE_TYPES.TSLiteralType;
}

/**
 * Returns true when an expression is a unary negative numeric literal.
 *
 * @param expression - Expression to inspect.
 * @returns True when the expression is `-<number>`.
 */
function isNegativeNumberUnaryExpression(
  expression: TSESTree.Expression,
): expression is TSESTree.UnaryExpression & {
  argument: TSESTree.NumberLiteral;
  operator: typeof NEGATIVE_NUMBER_OPERATOR;
} {
  return (
    expression.type === AST_NODE_TYPES.UnaryExpression &&
    expression.operator === NEGATIVE_NUMBER_OPERATOR &&
    expression.argument.type === AST_NODE_TYPES.Literal &&
    isNumber(expression.argument.value)
  );
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
 * Returns true when an expression is a no-substitution template literal.
 *
 * @param expression - Expression to inspect.
 * @returns True when the expression has no interpolations.
 */
function isNoSubstitutionTemplateLiteral(
  expression: TSESTree.Expression,
): expression is TSESTree.TemplateLiteral & {
  expressions: [];
} {
  return expression.type === AST_NODE_TYPES.TemplateLiteral && expression.expressions.length === 0;
}

/**
 * Returns true when resolved const-literal metadata matches one expected kind.
 *
 * @param resolvedLiteral - Resolved const-literal metadata.
 * @param expectedKind - Expected literal kind.
 * @returns True when the resolved literal matches the expected kind.
 */
function isResolvedConstLiteralKind(
  resolvedLiteral: IResolvedConstLiteral | null,
  expectedKind: ResolvedLiteralKind,
): resolvedLiteral is IResolvedConstLiteral {
  return resolvedLiteral !== null && resolvedLiteral.kind === expectedKind;
}

/**
 * Returns true when resolved const-literal metadata represents a string literal.
 *
 * @param resolvedLiteral - Resolved const-literal metadata.
 * @returns True when the resolved literal is a string-valued const.
 */
function isResolvedStringConstLiteral(
  resolvedLiteral: IResolvedConstLiteral | null,
): resolvedLiteral is IResolvedConstLiteral & {
  kind: ResolvedLiteralKind.String;
  value: string;
} {
  return (
    isResolvedConstLiteralKind(resolvedLiteral, ResolvedLiteralKind.String) &&
    isString(resolvedLiteral.value)
  );
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
    isString(type.literal.value)
  );
}

/**
 * Returns true when a union is assigned to a type alias declaration.
 *
 * @param node - Union type node to inspect.
 * @returns True when the containing type alias is a direct type alias declaration.
 */
function isTypeAliasUnion(node: TSESTree.TSUnionType): boolean {
  return getDirectTypeAliasDeclaration(node) !== null;
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
 * Resolves a literal expression value used by a const declaration.
 *
 * @param expression - Expression to inspect.
 * @returns Resolved literal metadata, or null when unsupported.
 */
function resolveLiteralExpressionValue(
  expression: TSESTree.Expression,
): Omit<IResolvedConstLiteral, 'memberName'> | null {
  const unwrappedExpression = unwrapTsExpression(expression);
  return (
    resolvePrimitiveLiteral(unwrappedExpression) ??
    resolveNegativeNumberLiteral(unwrappedExpression) ??
    resolveTemplateLiteral(unwrappedExpression)
  );
}

/**
 * Resolves one wrapped unary negative numeric literal.
 *
 * @param expression - Expression to inspect.
 * @returns Resolved numeric literal metadata, or null.
 */
function resolveNegativeNumberLiteral(
  expression: TSESTree.Expression,
): Omit<IResolvedConstLiteral, 'memberName'> | null {
  if (!isNegativeNumberUnaryExpression(expression)) {
    return null;
  }
  return { kind: ResolvedLiteralKind.Number, value: -expression.argument.value };
}

/**
 * Resolves one primitive literal expression.
 *
 * @param expression - Expression to inspect.
 * @returns Resolved primitive literal metadata, or null.
 */
function resolvePrimitiveLiteral(
  expression: TSESTree.Expression,
): Omit<IResolvedConstLiteral, 'memberName'> | null {
  if (expression.type !== AST_NODE_TYPES.Literal) {
    return null;
  }
  return resolvePrimitiveLiteralValue(expression.value);
}

/**
 * Resolves one primitive literal runtime value.
 *
 * @param value - Runtime literal value to inspect.
 * @returns Resolved primitive literal metadata, or null.
 */
function resolvePrimitiveLiteralValue(
  value: boolean | bigint | number | RegExp | string | null,
): Omit<IResolvedConstLiteral, 'memberName'> | null {
  if (isString(value)) {
    return { kind: ResolvedLiteralKind.String, value };
  }
  if (isNumber(value)) {
    return { kind: ResolvedLiteralKind.Number, value };
  }
  return isBoolean(value) ? { kind: ResolvedLiteralKind.Boolean, value } : null;
}

/**
 * Resolves one no-substitution template literal expression.
 *
 * @param expression - Expression to inspect.
 * @returns Resolved string literal metadata, or null.
 */
function resolveTemplateLiteral(
  expression: TSESTree.Expression,
): Omit<IResolvedConstLiteral, 'memberName'> | null {
  if (!isNoSubstitutionTemplateLiteral(expression)) {
    return null;
  }
  const cookedValue = getTemplateLiteralCookedValue(expression);
  /* istanbul ignore next -- invalid escapes are rejected for untagged template literals before this rule runs */
  if (cookedValue === null) {
    return null;
  }
  return {
    kind: ResolvedLiteralKind.String,
    value: cookedValue,
  };
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
