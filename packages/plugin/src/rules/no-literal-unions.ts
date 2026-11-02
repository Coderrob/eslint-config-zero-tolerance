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
import { getTypeReferenceName, unwrapTsExpression } from '../helpers/ast/types';
import { isBoolean, isNumber, isString } from '../helpers/type-guards';
import { VARIABLE_KIND_CONST } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type NoLiteralUnionsContext = Readonly<TSESLint.RuleContext<'noLiteralUnions', []>>;

interface IResolvedConstLiteral {
  kind: ResolvedLiteralKind;
  memberName: string;
  value: boolean | number | string;
}

enum ResolvedLiteralKind {
  Boolean = 'boolean',
  Number = 'number',
  String = 'string',
}

const BANNED_LITERAL_NODE_TYPES = new Set([AST_NODE_TYPES.Literal, AST_NODE_TYPES.TemplateLiteral]);
const NEGATIVE_NUMBER_OPERATOR = '-';
const TYPESCRIPT_UTILITY_TYPE_NAMES = new Set([
  'Awaited',
  'Capitalize',
  'ConstructorParameters',
  'Exclude',
  'Extract',
  'InstanceType',
  'Lowercase',
  'NoInfer',
  'NonNullable',
  'Omit',
  'OmitThisParameter',
  'Parameters',
  'Partial',
  'Pick',
  'Readonly',
  'Record',
  'Required',
  'ReturnType',
  'ThisParameterType',
  'ThisType',
  'Uncapitalize',
  'Uppercase',
]);

/**
 * Adds resolved const-literal declarations from one declaration node.
 *
 * @param declarations - Accumulated resolved declarations.
 * @param declaration - Variable declaration to inspect.
 */
function addConstLiteralDeclarations(
  declarations: Readonly<Map<string, IResolvedConstLiteral>>,
  declaration: Readonly<TSESTree.VariableDeclaration>,
): void {
  if (declaration.kind !== VARIABLE_KIND_CONST) {
    return;
  }
  for (const declarator of declaration.declarations) {
    const resolvedLiteral = getResolvedConstDeclaratorLiteral(declarator);
    if (resolvedLiteral !== null) {
      Reflect.apply(Map.prototype.set, declarations, [resolvedLiteral.memberName, resolvedLiteral]);
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
  context: Readonly<NoLiteralUnionsContext>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
  node: Readonly<TSESTree.TSUnionType>,
): void {
  if (isAllowedLiteralUnion(node, constLiteralMap)) {
    return;
  }
  if (!hasBannedLiteralUnionMember(node, constLiteralMap)) {
    return;
  }
  context.report({
    node,
    messageId: 'noLiteralUnions',
  });
}

/**
 * Creates listeners for literal-union checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoLiteralUnionsListeners(
  context: Readonly<NoLiteralUnionsContext>,
): TSESLint.RuleListener {
  const constLiteralMap = getConstLiteralDeclarations(context.sourceCode.ast.body);
  return {
    TSUnionType: checkUnionType.bind(undefined, context, constLiteralMap),
  };
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
  statement: Readonly<TSESTree.ProgramStatement>,
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
  node: Readonly<TSESTree.TSUnionType>,
): TSESTree.TSTypeAliasDeclaration | null {
  const parentNode = node.parent;
  if (parentNode.type !== AST_NODE_TYPES.TSTypeAliasDeclaration) {
    return null;
  }
  return parentNode;
}

/**
 * Returns the nearest containing type reference for a type node.
 *
 * @param node - Type node to inspect.
 * @returns Nearest type reference ancestor, or null when absent.
 */
function getNearestTypeReference(
  node: Readonly<TSESTree.TypeNode>,
): TSESTree.TSTypeReference | null {
  return getNearestTypeReferenceFromNode(node.parent);
}

/**
 * Recursively finds the nearest containing type reference.
 *
 * @param node - Node to inspect.
 * @returns Nearest type reference ancestor, or null when absent.
 */
function getNearestTypeReferenceFromNode(
  node: Readonly<TSESTree.Node>,
): TSESTree.TSTypeReference | null {
  if (node.type === AST_NODE_TYPES.Program) {
    return null;
  }
  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    return node;
  }
  return getNearestTypeReferenceFromNode(node.parent);
}

/**
 * Returns resolved literal metadata for one const declarator.
 *
 * @param declarator - Variable declarator to inspect.
 * @returns Resolved literal metadata, or null.
 */
function getResolvedConstDeclaratorLiteral(
  declarator: Readonly<TSESTree.VariableDeclarator>,
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
  type: Readonly<TSESTree.TypeNode>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
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
 * Returns the cooked string value from a no-substitution template literal.
 *
 * @param expression - Template literal to inspect.
 * @returns Cooked string value, or null when unavailable.
 */
function getTemplateLiteralCookedValue(
  expression: Readonly<TSESTree.TemplateLiteral>,
): string | null {
  return expression.quasis[0].value.cooked;
}

/**
 * Returns true when a union includes any banned literal member.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the union should be reported.
 */
function hasBannedLiteralUnionMember(
  node: Readonly<TSESTree.TSUnionType>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
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
  type: Readonly<TSESTree.TypeNode>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
  expectedKind: Readonly<ResolvedLiteralKind>,
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
function hasDirectLiteralUnionMember(node: Readonly<TSESTree.TSUnionType>): boolean {
  for (const unionMember of node.types) {
    if (isLiteralTypeNode(unionMember) && BANNED_LITERAL_NODE_TYPES.has(unionMember.literal.type)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when any union member is a const-reference literal in a type alias.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the type alias includes a literal const reference.
 */
function hasLiteralConstReferenceUnionMember(
  node: Readonly<TSESTree.TSUnionType>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
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
 * Returns true when a union is allowed without reporting.
 *
 * @param node - Union type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when another rule owns the union or it matches an explicit exemption.
 */
function isAllowedLiteralUnion(
  node: Readonly<TSESTree.TSUnionType>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
): boolean {
  return (
    isDirectPropertyTypeAnnotationUnion(node) ||
    isBooleanLiteralUnion(node, constLiteralMap) ||
    isInsideTypeScriptUtilityType(node)
  );
}

/**
 * Returns true when a type node represents a boolean literal type.
 *
 * @param type - Type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the type is a `true`/`false` literal or boolean-literal const reference.
 */
function isBooleanLiteralType(
  type: Readonly<TSESTree.TypeNode>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
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
  node: Readonly<TSESTree.TSUnionType>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
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
function isDirectBooleanLiteralType(type: Readonly<TSESTree.TypeNode>): boolean {
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
function isDirectPropertyTypeAnnotationUnion(node: Readonly<TSESTree.TSUnionType>): boolean {
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
  statement: Readonly<TSESTree.ProgramStatement>,
): statement is TSESTree.ExportNamedDeclaration & {
  declaration: TSESTree.VariableDeclaration;
} {
  return (
    statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
    statement.declaration?.type === AST_NODE_TYPES.VariableDeclaration
  );
}

/**
 * Returns true when a union is inside a built-in TypeScript utility type reference.
 *
 * @param node - Union type node to inspect.
 * @returns True when the nearest enclosing type reference is a TypeScript utility type.
 */
function isInsideTypeScriptUtilityType(node: Readonly<TSESTree.TSUnionType>): boolean {
  const typeReference = getNearestTypeReference(node);
  return typeReference !== null && isTypeScriptUtilityTypeReference(typeReference);
}

/**
 * Returns true when a type node references a literal-valued const declaration.
 *
 * @param type - Type node to inspect.
 * @param constLiteralMap - Resolved literal-valued const declarations in the file.
 * @returns True when the type query resolves to a literal-valued const.
 */
function isLiteralConstReferenceType(
  type: Readonly<TSESTree.TypeNode>,
  constLiteralMap: Readonly<ReadonlyMap<string, IResolvedConstLiteral>>,
): boolean {
  return getResolvedConstLiteral(type, constLiteralMap) !== null;
}

/**
 * Returns true when a type node represents a literal type.
 *
 * @param type - Type node to inspect.
 * @returns True when the node is a `TSLiteralType`.
 */
function isLiteralTypeNode(type: Readonly<TSESTree.TypeNode>): type is TSESTree.TSLiteralType {
  return type.type === AST_NODE_TYPES.TSLiteralType;
}

/**
 * Returns true when an expression is a unary negative numeric literal.
 *
 * @param expression - Expression to inspect.
 * @returns True when the expression is `-<number>`.
 */
function isNegativeNumberUnaryExpression(
  expression: Readonly<TSESTree.Expression>,
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
 * Returns true when an expression is a no-substitution template literal.
 *
 * @param expression - Expression to inspect.
 * @returns True when the expression has no interpolations.
 */
function isNoSubstitutionTemplateLiteral(
  expression: Readonly<TSESTree.Expression>,
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
  expectedKind: Readonly<ResolvedLiteralKind>,
): resolvedLiteral is IResolvedConstLiteral {
  return resolvedLiteral !== null && resolvedLiteral.kind === expectedKind;
}

/**
 * Returns true when a union is assigned to a type alias declaration.
 *
 * @param node - Union type node to inspect.
 * @returns True when the containing type alias is a direct type alias declaration.
 */
function isTypeAliasUnion(node: Readonly<TSESTree.TSUnionType>): boolean {
  return getDirectTypeAliasDeclaration(node) !== null;
}

/**
 * Returns true when a type reference names a built-in TypeScript utility type.
 *
 * @param node - Type reference to inspect.
 * @returns True when the type reference is a known TypeScript utility type.
 */
function isTypeScriptUtilityTypeReference(node: Readonly<TSESTree.TSTypeReference>): boolean {
  const typeReferenceName = getTypeReferenceName(node);
  return typeReferenceName !== null && TYPESCRIPT_UTILITY_TYPE_NAMES.has(typeReferenceName);
}

/**
 * Resolves a literal expression value used by a const declaration.
 *
 * @param expression - Expression to inspect.
 * @returns Resolved literal metadata, or null when unsupported.
 */
function resolveLiteralExpressionValue(
  expression: Readonly<TSESTree.Expression>,
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
  expression: Readonly<TSESTree.Expression>,
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
  expression: Readonly<TSESTree.Expression>,
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
  expression: Readonly<TSESTree.Expression>,
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
 * ESLint rule that prohibits literal unions in favor of enums.
 */
export const noLiteralUnions = createRule({
  name: 'no-literal-unions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Report literal unions for manual migration to enums',
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
