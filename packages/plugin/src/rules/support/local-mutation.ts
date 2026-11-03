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

import { findBinding, getStableInitializer, unwrapTypeExpression } from './local-values';

import { isRepeatedEscape } from './repeated-escape';
import { getCalleeName } from './security-ast';

interface ILocalWrite {
  owner: TSESTree.Node;
  write: TSESTree.Node;
  member: TSESTree.MemberExpression;
}

const INITIALIZER_KIND = 'init';

/** Reads an accessor name without treating computed identifiers as static keys.
 * @param property - Accessor declaration.
 * @returns The static key, or null when its value is unknown.
 */
function accessorPropertyName(property: Readonly<TSESTree.Property>): string | null {
  if (!property.computed && property.key.type === AST_NODE_TYPES.Identifier)
    return property.key.name;
  return property.key.type === AST_NODE_TYPES.Literal ? String(property.key.value) : null;
}

/** Excludes initialization and property access from publication checks.
 * @param reference - Reference to the local container.
 * @returns Whether this use can publish or alias the container.
 */
function isEscapeCandidate(reference: Readonly<TSESLint.Scope.Reference>): boolean {
  return (
    reference.init !== true && reference.identifier.parent.type !== AST_NODE_TYPES.MemberExpression
  );
}

/**
 * Rejects containers published before a write, including on earlier loop iterations.
 * @param location - Function and mutation being checked.
 * @param allocation - Fresh container initializer.
 * @param reference - Reference to the local binding.
 * @returns The result of the described check or resolution.
 */
function isEscapingReference(
  location: Readonly<ILocalWrite>,
  allocation: Readonly<TSESTree.Node>,
  reference: Readonly<TSESLint.Scope.Reference>,
): boolean {
  if (reference.from.variableScope.block !== location.owner) return true;
  if (!isEscapeCandidate(reference)) return false;
  return (
    reference.identifier.range[0] < location.write.range[0] ||
    isRepeatedEscape(allocation, location.write, reference.identifier)
  );
}

/**
 * Checks allocation and escapes for a local container binding.
 * @param source - Source code and lexical scopes.
 * @param target - Binding or property being modified.
 * @param binding - Resolved lexical binding.
 * @param location - Owner and mutation location.
 * @returns The result of the described check or resolution.
 */
function isFreshLocalContainer(
  source: Readonly<TSESLint.SourceCode>,
  target: Readonly<TSESTree.Identifier>,
  binding: Readonly<TSESLint.Scope.Variable>,
  location: Readonly<ILocalWrite>,
): boolean {
  const initializer = getStableInitializer(source, target);
  if (initializer === null || !isSafeLocalTarget(initializer, location)) return false;
  return !binding.references.some(isEscapingReference.bind(undefined, location, initializer));
}

/**
 * Checks whether a binding belongs to the current function rather than an outer scope.
 * @param binding - Resolved lexical binding.
 * @param owner - Function owning the local computation.
 * @returns The result of the described check or resolution.
 */
function isLocalBinding(
  binding: Readonly<TSESLint.Scope.Variable>,
  owner: Readonly<TSESTree.Node>,
): boolean {
  return binding.scope.variableScope.block === owner;
}

/**
 * Allows direct writes to newly allocated local arrays and objects that have not escaped.
 * @param source - Source code and lexical scopes.
 * @param target - Binding or property being modified.
 * @param owner - Function owning the local computation.
 * @param write - Mutation expression being checked.
 * @returns The result of the described check or resolution.
 */
function isLocalContainer(
  source: Readonly<TSESLint.SourceCode>,
  target: Readonly<TSESTree.MemberExpression>,
  owner: Readonly<TSESTree.Node>,
  write: Readonly<TSESTree.Node>,
): boolean {
  if (target.object.type !== AST_NODE_TYPES.Identifier) return false;
  const binding = findBinding(source, target.object);
  if (binding === null || !isLocalBinding(binding, owner)) return false;
  return isFreshLocalContainer(source, target.object, binding, { owner, write, member: target });
}

/**
 * Distinguishes local binding changes and fresh-container writes from observable mutation.
 * @param source - Source code and lexical scopes.
 * @param target - Binding or property being modified.
 * @param owner - Function owning the local computation.
 * @param write - Mutation expression being checked.
 * @returns The result of the described check or resolution.
 */
export function isLocalMutation(
  source: Readonly<TSESLint.SourceCode>,
  target: Readonly<TSESTree.Node>,
  owner: Readonly<TSESTree.Node>,
  write: Readonly<TSESTree.Node>,
): boolean {
  if (target.type === AST_NODE_TYPES.MemberExpression) {
    return isLocalContainer(source, target, owner, write);
  }
  if (target.type !== AST_NODE_TYPES.Identifier) return false;
  const binding = findBinding(source, target);
  return binding !== null && isLocalBinding(binding, owner);
}

/** Checks whether an accessor can handle the target key, including unknown computed keys.
 * @param name - Target property name, or null for dynamic access.
 * @param property - Property on the fresh object literal.
 * @returns Whether the property may invoke an accessor during the write.
 */
function isMatchingAccessor(
  name: string | null,
  property: TSESTree.Property | TSESTree.SpreadElement,
): boolean {
  if (property.type !== AST_NODE_TYPES.Property || property.kind === INITIALIZER_KIND) return false;
  return isMatchingAccessorKey(name, property);
}

/** Matches static accessor keys conservatively when either key is dynamic.
 * @param name - Target property name.
 * @param property - Accessor declaration.
 * @returns Whether the accessor may be the mutation target.
 */
function isMatchingAccessorKey(
  name: string | null,
  property: Readonly<TSESTree.Property>,
): boolean {
  const accessorName = accessorPropertyName(property);
  return name === null || accessorName === null || accessorName === name;
}

/** Excludes accessors and arbitrary object methods from local mutation exemptions.
 * @param initializer - Allocation expression for the local binding.
 * @param location - Member access and mutation being inspected.
 * @returns Whether the operation is known to affect only the fresh container.
 */
function isSafeLocalTarget(
  initializer: Readonly<TSESTree.Expression>,
  location: Readonly<ILocalWrite>,
): boolean {
  const value = unwrapTypeExpression(initializer);
  if (value.type === AST_NODE_TYPES.ArrayExpression) return true;
  if (value.type !== AST_NODE_TYPES.ObjectExpression) return false;
  return isSafeObjectOperation(value, location);
}

/** Permits deletion without invoking accessors but rejects effectful calls and writes.
 * @param initializer - Fresh object allocation.
 * @param location - Mutation being inspected.
 * @returns Whether the operation cannot invoke a local accessor or arbitrary method.
 */
function isSafeObjectOperation(
  initializer: Readonly<TSESTree.ObjectExpression>,
  location: Readonly<ILocalWrite>,
): boolean {
  if (location.write.type === AST_NODE_TYPES.UnaryExpression) return true;
  if (location.write.type === AST_NODE_TYPES.CallExpression) return false;
  return !initializer.properties.some(
    isMatchingAccessor.bind(undefined, getCalleeName(location.member)),
  );
}
