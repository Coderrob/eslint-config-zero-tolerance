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

import type ts from 'typescript';

import { resolveLocalValue } from './local-values';

/** Resolves base declarations for instantiated generic class references.
 * @param checker - Type checker for the current program.
 * @param type - Receiver type whose direct bases are unavailable.
 * @returns The base types of the underlying declaration, if any.
 */
function declaredBaseTypes(
  checker: Readonly<ts.TypeChecker>,
  type: Readonly<ts.Type>,
): readonly ts.Type[] {
  const symbol = type.getSymbol();
  if (symbol === undefined) return [];
  return checker.getDeclaredTypeOfSymbol(symbol).getBaseTypes() ?? [];
}

/**
 * Identifies array receivers using types or a conservative local literal fallback.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
export function isArrayReceiver(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Expression>,
): boolean {
  const services = source.parserServices;
  if (services?.program && services.esTreeNodeToTSNodeMap) {
    const checker = services.program.getTypeChecker();
    return isArrayType(
      checker,
      checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node)),
      [],
    );
  }
  return resolveLocalValue(source, node).type === AST_NODE_TYPES.ArrayExpression;
}

/**
 * Recognizes arrays and tuples, including constrained generics and union members.
 * @param checker - Input checker for this operation.
 * @param type - Input type for this operation.
 * @param seen - Types already visited along this inheritance path.
 * @returns The result of the described check or resolution.
 */
function isArrayType(
  checker: Readonly<ts.TypeChecker>,
  type: Readonly<ts.Type>,
  seen: readonly ts.Type[],
): boolean {
  const resolved = checker.getBaseConstraintOfType(type) ?? type;
  if (seen.includes(resolved)) return false;
  if (isNativeArrayType(checker, resolved)) return true;
  return relatedTypes(checker, resolved).some((member) =>
    isArrayType(checker, member, [...seen, resolved]),
  );
}

/** Recognizes native array and tuple representations.
 * @param checker - Type checker for the current program.
 * @param type - Receiver type to inspect.
 * @returns Whether TypeScript identifies an array or tuple directly.
 */
function isNativeArrayType(checker: Readonly<ts.TypeChecker>, type: Readonly<ts.Type>): boolean {
  return checker.isArrayType(type) || checker.isTupleType(type);
}

/** Returns constituent and inherited types for array detection.
 * @param checker - Type checker for the current program.
 * @param type - Resolved receiver type.
 * @returns Union/intersection members or base classes and interfaces.
 */
function relatedTypes(
  checker: Readonly<ts.TypeChecker>,
  type: Readonly<ts.Type>,
): readonly ts.Type[] {
  if (type.isUnionOrIntersection()) return type.types;
  return type.getBaseTypes() ?? declaredBaseTypes(checker, type);
}
