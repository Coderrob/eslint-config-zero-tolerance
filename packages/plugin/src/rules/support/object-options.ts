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
import { findBinding, resolveLocalValue, unwrapTypeExpression } from './local-values';

interface IResolvedOption {
  known: boolean;
  value: TSESTree.Node | null;
}

const INITIALIZER_KIND = 'init';

interface IOptionState {
  source: TSESLint.SourceCode;
  name: string;
  seen: readonly TSESTree.Node[];
}

const DELETE_OPERATOR = 'delete';

/** Rejects directly mutated local option objects rather than trusting their initial value.
 * @param source - Source code and lexical scopes.
 * @param node - Candidate local options reference.
 * @returns Whether a direct property write makes the initializer unreliable.
 */
function isModifiedOptionsBinding(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
): boolean {
  const reference = unwrapTypeExpression(node);
  if (reference.type !== AST_NODE_TYPES.Identifier) return false;
  const binding = findBinding(source, reference);
  return binding !== null && binding.references.some(isPropertyWrite);
}

/** Checks whether a member is the target of an assignment, update, or deletion.
 * @param member - Member access being inspected.
 * @returns Whether the surrounding operation writes to the member.
 */
function isPropertyMutation(member: Readonly<TSESTree.MemberExpression>): boolean {
  const operation = member.parent;
  if (operation.type === AST_NODE_TYPES.AssignmentExpression) return operation.left === member;
  return isPropertyUpdate(operation);
}

/** Recognizes property update and deletion nodes.
 * @param node - Parent of the referenced member.
 * @returns Whether the operation mutates the property.
 */
function isPropertyUpdate(node: Readonly<TSESTree.Node>): boolean {
  return (
    node.type === AST_NODE_TYPES.UpdateExpression ||
    (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === DELETE_OPERATOR)
  );
}

/** Detects direct assignment, update, and delete operations on a local binding.
 * @param reference - Reference to the options binding.
 * @returns Whether the reference writes to a property.
 */
function isPropertyWrite(reference: Readonly<TSESLint.Scope.Reference>): boolean {
  const receiver = outerTypeExpression(reference.identifier);
  const member = receiver.parent;
  if (member?.type !== AST_NODE_TYPES.MemberExpression || member.object !== receiver) return false;
  return isPropertyMutation(member);
}

/**
 * Reads only literal string keys.
 * @param key - Property key to resolve.
 * @returns The result of the described check or resolution.
 */
function literalKey(key: Readonly<TSESTree.Node>): string | null {
  if (key.type !== AST_NODE_TYPES.Literal) return null;
  return typeof key.value === 'string' ? key.value : null;
}

/**
 * Resolves a static property name, excluding computed identifier keys.
 * @param property - Object property to inspect.
 * @returns The result of the described check or resolution.
 */
function optionName(property: Readonly<TSESTree.Property>): string | null {
  if (!property.computed && property.key.type === AST_NODE_TYPES.Identifier)
    return property.key.name;
  return literalKey(property.key);
}

/** Finds the outermost assertion around a reference without following aliases.
 * @param node - Reference or assertion wrapper.
 * @returns The expression used by the surrounding operation.
 */
function outerTypeExpression(node: Readonly<TSESTree.Node>): TSESTree.Node {
  const parent = node.parent;
  return parent != null && unwrapTypeExpression(parent) !== parent
    ? outerTypeExpression(parent)
    : node;
}

/**
 * Resolves effective options, honoring spreads and later overrides.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param name - Name to resolve.
 * @returns The result of the described check or resolution.
 */
export function readOption(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
  name: string,
): TSESTree.Node | null {
  return resolveOption(source, node, name, []).value;
}

/**
 * Resolves one named property or blocks unsafe computed keys and getters.
 * @param property - Object property to inspect.
 * @param name - Name to resolve.
 * @returns The result of the described check or resolution.
 */
function resolveNamedProperty(
  property: Readonly<TSESTree.Property>,
  name: string,
): IResolvedOption {
  const key = optionName(property);
  if (key === null) return { known: false, value: null };
  if (key !== name) return { known: true, value: null };
  return { known: false, value: property.kind === INITIALIZER_KIND ? property.value : null };
}

/**
 * Resolves an object while distinguishing missing properties from unknown overrides.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param name - Name to resolve.
 * @param seen - Nodes already visited during resolution.
 * @returns The result of the described check or resolution.
 */
function resolveOption(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
  name: string,
  seen: readonly TSESTree.Node[],
): IResolvedOption {
  if (isModifiedOptionsBinding(source, node)) return { known: false, value: null };
  const value = resolveLocalValue(source, node);
  if (value.type !== AST_NODE_TYPES.ObjectExpression || seen.includes(value))
    return { known: false, value: null };
  return value.properties.reduceRight(
    resolveProperty.bind(undefined, { source, name, seen: [...seen, value] }),
    { known: true, value: null },
  );
}

/**
 * Examines earlier properties only when later properties cannot override the requested key.
 * @param state - Source, property name, and visited objects.
 * @param result - Result from later object properties.
 * @param property - Object property to inspect.
 * @returns The result of the described check or resolution.
 */
function resolveProperty(
  state: Readonly<IOptionState>,
  result: Readonly<IResolvedOption>,
  property: TSESTree.Property | TSESTree.SpreadElement,
): IResolvedOption {
  if (!result.known || result.value !== null) return result;
  if (property.type === AST_NODE_TYPES.SpreadElement)
    return resolveOption(state.source, property.argument, state.name, state.seen);
  return resolveNamedProperty(property, state.name);
}
