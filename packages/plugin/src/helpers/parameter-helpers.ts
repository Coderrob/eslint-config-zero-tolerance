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
 * Reusable parameter-shape helpers shared across multiple rule implementations.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/**
 * Returns the identifier bound by an assignment-pattern parameter.
 *
 * @param param - Assignment-pattern parameter node.
 * @returns Identifier bound by the pattern, or null when unsupported.
 */
export function getAssignmentPatternIdentifier(
  param: TSESTree.AssignmentPattern,
): TSESTree.Identifier | null {
  return param.left.type === AST_NODE_TYPES.Identifier ? param.left : null;
}

/**
 * Returns the identifier bound by a parameter when directly nameable.
 *
 * Supports plain identifiers, default assignments with identifier left-hand
 * sides, and rest parameters with identifier arguments.
 *
 * @param param - Function parameter node.
 * @returns Bound identifier, or null when the parameter is destructured.
 */
export function getNamedParameterIdentifier(param: TSESTree.Parameter): TSESTree.Identifier | null {
  if (param.type === AST_NODE_TYPES.Identifier) {
    return param;
  }
  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    return getAssignmentPatternIdentifier(param);
  }
  if (param.type === AST_NODE_TYPES.RestElement) {
    return getRestElementIdentifier(param);
  }
  return null;
}

/**
 * Returns the bound identifier name for a directly nameable parameter.
 *
 * @param param - Function parameter node.
 * @returns Parameter name, or null when the parameter is destructured.
 */
export function getNamedParameterName(param: TSESTree.Parameter): string | null {
  const identifier = getNamedParameterIdentifier(param);
  return identifier?.name ?? null;
}

/**
 * Returns the identifier bound by a rest parameter.
 *
 * @param param - Rest parameter node.
 * @returns Identifier bound by the rest parameter, or null when unsupported.
 */
export function getRestElementIdentifier(param: TSESTree.RestElement): TSESTree.Identifier | null {
  return param.argument.type === AST_NODE_TYPES.Identifier ? param.argument : null;
}
