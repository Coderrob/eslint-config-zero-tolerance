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
 * Higher-level AST parameter helpers for type annotations and special parameter shapes.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

const THIS_PARAMETER_NAME = 'this';

/**
 * Returns the type annotation from a directly annotatable parameter shape.
 *
 * @param param - Directly annotatable parameter node.
 * @returns Type annotation when present.
 */
function getAnnotatableParameterTypeAnnotation(
  param:
    | TSESTree.ArrayPattern
    | TSESTree.Identifier
    | TSESTree.ObjectPattern
    | TSESTree.RestElement,
): TSESTree.TSTypeAnnotation | null {
  return 'typeAnnotation' in param ? (param.typeAnnotation ?? null) : null;
}

/**
 * Returns the type annotation from an assignment-pattern parameter.
 *
 * @param param - Assignment-pattern parameter.
 * @returns Type annotation when present.
 */
function getAssignmentPatternTypeAnnotation(
  param: Readonly<TSESTree.AssignmentPattern>,
): TSESTree.TSTypeAnnotation | null {
  return getAnnotatableParameterTypeAnnotation(param.left);
}

/**
 * Returns the type node for a directly annotated object-pattern parameter.
 *
 * @param param - Function parameter node.
 * @returns Type node when the parameter is an annotated object pattern.
 */
function getDirectObjectDestructuredTypeNode(param: Readonly<TSESTree.Parameter>): TSESTree.TypeNode | null {
  return param.type === AST_NODE_TYPES.ObjectPattern
    ? (param.typeAnnotation?.typeAnnotation ?? null)
    : null;
}

/**
 * Returns the first parameter that is not the TypeScript `this` pseudo-parameter.
 *
 * @param params - Function parameter list.
 * @returns First non-`this` parameter, or undefined when none exists.
 */
export function getFirstNonThisParameter(
  params: ReadonlyArray<TSESTree.Parameter>,
): TSESTree.Parameter | undefined {
  for (const param of params) {
    if (!isThisParameter(param)) {
      return param;
    }
  }
  return undefined;
}

/**
 * Returns the type node for an assignment-pattern object destructuring parameter.
 *
 * @param param - Assignment-pattern parameter.
 * @returns Type node when the assignment pattern destructures an annotated object.
 */
function getObjectDestructuredAssignmentTypeNode(
  param: Readonly<TSESTree.AssignmentPattern>,
): TSESTree.TypeNode | null {
  const left = param.left;
  return left.type === AST_NODE_TYPES.ObjectPattern
    ? (left.typeAnnotation?.typeAnnotation ?? null)
    : null;
}

/**
 * Returns the type node for an object-destructured parameter shape.
 *
 * Supports directly annotated object patterns and assignment patterns whose
 * left-hand side is an annotated object pattern.
 *
 * @param param - Function parameter node.
 * @returns Type node when the parameter destructures an object and is annotated.
 */
export function getObjectDestructuredParameterTypeNode(
  param: Readonly<TSESTree.Parameter>,
): TSESTree.TypeNode | null {
  const directTypeNode = getDirectObjectDestructuredTypeNode(param);
  if (directTypeNode !== null) {
    return directTypeNode;
  }
  return param.type === AST_NODE_TYPES.AssignmentPattern
    ? getObjectDestructuredAssignmentTypeNode(param)
    : null;
}

/**
 * Returns the type annotation for a supported parameter shape.
 *
 * @param param - Function parameter node.
 * @returns Type annotation when present.
 */
export function getParameterTypeAnnotation(
  param: Readonly<TSESTree.Parameter>,
): TSESTree.TSTypeAnnotation | null {
  if (param.type === AST_NODE_TYPES.TSParameterProperty) {
    return getTsParameterPropertyTypeAnnotation(param);
  }
  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    return getAssignmentPatternTypeAnnotation(param);
  }
  return getAnnotatableParameterTypeAnnotation(param);
}

/**
 * Returns the type node for a supported parameter shape.
 *
 * @param param - Function parameter node.
 * @returns Type node when present.
 */
export function getParameterTypeNode(param: Readonly<TSESTree.Parameter>): TSESTree.TypeNode | null {
  return getParameterTypeAnnotation(param)?.typeAnnotation ?? null;
}

/**
 * Returns the type annotation from a constructor parameter property.
 *
 * @param param - TSParameterProperty node.
 * @returns Type annotation when present.
 */
function getTsParameterPropertyTypeAnnotation(
  param: Readonly<TSESTree.TSParameterProperty>,
): TSESTree.TSTypeAnnotation | null {
  const inner = param.parameter;
  return inner.type === AST_NODE_TYPES.AssignmentPattern
    ? getAssignmentPatternTypeAnnotation(inner)
    : (inner.typeAnnotation ?? null);
}

/**
 * Returns true when the parameter is the TypeScript `this` pseudo-parameter.
 *
 * @param param - Function parameter node.
 * @returns True when the parameter is `this`.
 */
export function isThisParameter(param: Readonly<TSESTree.Parameter>): boolean {
  return param.type === AST_NODE_TYPES.Identifier && param.name === THIS_PARAMETER_NAME;
}
