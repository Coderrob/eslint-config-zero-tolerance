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
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
import { isUncomputedMemberExpressionNode } from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

enum CollectionKind {
  Map = 'Map',
  Set = 'Set',
}

const MAP_MUTATION_METHODS = new Set(['clear', 'delete', 'set']);
const SET_MUTATION_METHODS = new Set(['add', 'clear', 'delete']);

type NoMapSetMutationContext = Readonly<TSESLint.RuleContext<'noMapSetMutation', []>>;

interface ITypeContext {
  checker: ts.TypeChecker;
  type: ts.Type;
}

interface ICollectionMethodCall {
  object: TSESTree.Expression;
  property: TSESTree.Identifier;
}

/**
 * Checks call expressions for Map and Set mutation methods.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: NoMapSetMutationContext,
  node: TSESTree.CallExpression,
): void {
  const collectionMethodCall = getCollectionMethodCall(node.callee);
  if (collectionMethodCall === null) {
    return;
  }
  const collectionKind = getCollectionKind(context, collectionMethodCall.object);
  if (collectionKind === null) {
    return;
  }
  if (!isMutationMethod(collectionKind, collectionMethodCall.property.name)) {
    return;
  }
  reportCollectionMutation(context, node, collectionKind, collectionMethodCall.property.name);
}

/**
 * Creates listeners for Map and Set mutation checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoMapSetMutationListeners(
  context: NoMapSetMutationContext,
): TSESLint.RuleListener {
  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/**
 * Returns the collection kind for a runtime expression, or null when unknown.
 *
 * @param context - ESLint rule execution context.
 * @param node - Expression being called as a collection receiver.
 * @returns Map, Set, or null when the type is not recognized.
 */
function getCollectionKind(
  context: NoMapSetMutationContext,
  node: TSESTree.Expression,
): CollectionKind | null {
  const typeContext = getTypeContext(context, node);
  if (typeContext === null) {
    return null;
  }
  return getCollectionKindFromTypeText(getTypeTexts(typeContext.checker, typeContext.type));
}

/**
 * Returns Map, Set, or null from type-text representations.
 *
 * @param typeTexts - Type texts collected from the receiver type.
 * @returns Map, Set, or null when unmatched.
 */
function getCollectionKindFromTypeText(typeTexts: readonly string[]): CollectionKind | null {
  if (typeTexts.some(isMapTypeText)) {
    return CollectionKind.Map;
  }
  return typeTexts.some(isSetTypeText) ? CollectionKind.Set : null;
}

/**
 * Returns a mutable collection method call shape when the callee is a named member access.
 *
 * @param callee - Call expression callee.
 * @returns Member expression with an identifier property, or null when not applicable.
 */
function getCollectionMethodCall(
  callee: TSESTree.Expression,
): ICollectionMethodCall | null {
  if (!isUncomputedMemberExpressionNode(callee)) {
    return null;
  }
  return callee.property.type === AST_NODE_TYPES.Identifier
    ? { object: callee.object, property: callee.property }
    : null;
}

/**
 * Returns type context when type-aware linting is available.
 *
 * @param context - ESLint rule execution context.
 * @param node - Expression whose type should be inspected.
 * @returns Checker and resolved type, or null when unavailable.
 */
function getTypeContext(
  context: NoMapSetMutationContext,
  node: TSESTree.Expression,
): ITypeContext | null {
  try {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();
    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
    return {
      checker,
      type: checker.getTypeAtLocation(tsNode),
    };
  } catch {
    return null;
  }
}

/**
 * Returns type-text representations for a type, flattening unions.
 *
 * @param checker - TypeScript type checker.
 * @param type - Type to inspect.
 * @returns Flat list of rendered type texts.
 */
function getTypeTexts(checker: ts.TypeChecker, type: ts.Type): string[] {
  if (!isUnionType(type)) {
    return [checker.typeToString(type)];
  }
  return type.types.flatMap(
    /** @param memberType - Union member type. */
    (memberType) => getTypeTexts(checker, memberType),
  );
}

/**
 * Returns true when a rendered type text is a Map instance type.
 *
 * @param typeText - Rendered type text.
 * @returns True when the text represents Map.
 */
function isMapTypeText(typeText: string): boolean {
  return (
    typeText === CollectionKind.Map ||
    typeText.startsWith(`${CollectionKind.Map}<`) ||
    typeText === `Readonly${CollectionKind.Map}` ||
    typeText.startsWith(`Readonly${CollectionKind.Map}<`)
  );
}

/**
 * Returns true when a mutation method belongs to the detected collection kind.
 *
 * @param collectionKind - Collection kind derived from the receiver type.
 * @param methodName - Called method name.
 * @returns True when the method mutates the detected collection kind.
 */
function isMutationMethod(collectionKind: CollectionKind, methodName: string): boolean {
  return collectionKind === CollectionKind.Map
    ? MAP_MUTATION_METHODS.has(methodName)
    : SET_MUTATION_METHODS.has(methodName);
}

/**
 * Returns true when a rendered type text is a Set instance type.
 *
 * @param typeText - Rendered type text.
 * @returns True when the text represents Set.
 */
function isSetTypeText(typeText: string): boolean {
  return (
    typeText === CollectionKind.Set ||
    typeText.startsWith(`${CollectionKind.Set}<`) ||
    typeText === `Readonly${CollectionKind.Set}` ||
    typeText.startsWith(`Readonly${CollectionKind.Set}<`)
  );
}

/**
 * Returns true when a type is a TypeScript union.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type is a union.
 */
function isUnionType(type: ts.Type): type is ts.UnionType {
  return (type.flags & ts.TypeFlags.Union) !== 0;
}

/**
 * Reports a Map or Set mutation call.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node to report.
 * @param collectionKind - Detected collection kind.
 * @param methodName - Called mutation method.
 */
function reportCollectionMutation(
  context: NoMapSetMutationContext,
  node: TSESTree.CallExpression,
  collectionKind: CollectionKind,
  methodName: string,
): void {
  context.report({
    node,
    messageId: 'noMapSetMutation',
    data: { collection: collectionKind, method: methodName },
  });
}

/** ESLint rule that disallows direct Map and Set mutation methods. */
export const noMapSetMutation = createRule({
  name: 'no-map-set-mutation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow direct Map and Set mutation methods; rebuild collections instead of mutating them in place',
    },
    messages: {
      noMapSetMutation:
        'Avoid {{collection}} mutation via .{{method}}(); create a new collection instead of mutating shared state.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoMapSetMutationListeners,
});

export default noMapSetMutation;
