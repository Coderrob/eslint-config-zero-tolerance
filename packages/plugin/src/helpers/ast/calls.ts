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
 * Higher-level AST helpers for evaluating call and callee shapes.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  isCallExpressionNode,
  isIdentifierNode,
  isMemberExpressionNode,
} from '../ast-guards';
import { getMemberPropertyName } from '../ast-helpers';
import { isString } from '../type-guards';

type StringLiteralArgument = TSESTree.Literal & { value: string };

/**
 * Returns a call-expression argument by index.
 *
 * @param node - Call expression node.
 * @param index - Zero-based argument index.
 * @returns Argument node, or null when absent.
 */
export function getCallArgument(
  node: TSESTree.CallExpression,
  index: number,
): TSESTree.CallExpressionArgument | null {
  return node.arguments[index] ?? null;
}

/**
 * Returns the static callee name path for identifier/member/call forms.
 *
 * Examples:
 * - `describe` -> `["describe"]`
 * - `test.skip` -> `["test", "skip"]`
 * - `describe.only.each` -> `["describe", "only", "each"]`
 *
 * Returns null when the path cannot be resolved statically, such as when a
 * member property is computed from a non-string expression.
 *
 * @param callee - Callee node to inspect.
 * @returns Ordered callee name path, or null when unresolved.
 */
export function getCalleeNamePath(callee: TSESTree.Node): string[] | null {
  if (isIdentifierNode(callee)) {
    return [callee.name];
  }
  if (isCallExpressionNode(callee)) {
    return getCalleeNamePathFromCallExpression(callee);
  }
  if (isMemberExpressionNode(callee)) {
    return getCalleeNamePathFromMemberExpression(callee);
  }
  return null;
}

/**
 * Returns the static callee name path for a call-expression callee.
 *
 * @param callee - Call expression callee to inspect.
 * @returns Ordered callee name path, or null when unresolved.
 */
function getCalleeNamePathFromCallExpression(callee: TSESTree.CallExpression): string[] | null {
  return getCalleeNamePath(callee.callee);
}

/**
 * Returns the static callee name path for a member-expression callee.
 *
 * @param callee - Member expression callee to inspect.
 * @returns Ordered callee name path, or null when unresolved.
 */
function getCalleeNamePathFromMemberExpression(callee: TSESTree.MemberExpression): string[] | null {
  const propertyName = getMemberPropertyName(callee);
  const objectPath = getCalleeNamePath(callee.object);
  if (propertyName === null || objectPath === null) {
    return null;
  }
  return [...objectPath, propertyName];
}

/**
 * Returns the string-literal argument node at the given call argument index.
 *
 * @param node - Call expression node.
 * @param index - Zero-based argument index.
 * @returns String literal argument node, or null when absent or not a string literal.
 */
export function getStringLiteralCallArgument(
  node: TSESTree.CallExpression,
  index: number,
): StringLiteralArgument | null {
  const argument = getCallArgument(node, index);
  if (!isStringLiteralArgument(argument)) {
    return null;
  }
  return argument;
}

/**
 * Returns true when a call expression resolves to the provided static callee path.
 *
 * @param node - Call expression node.
 * @param expectedPath - Expected ordered callee name path.
 * @returns True when the callee path matches exactly.
 */
export function hasCallCalleeNamePath(
  node: TSESTree.CallExpression,
  expectedPath: ReadonlyArray<string>,
): boolean {
  const actualPath = getCalleeNamePath(node.callee);
  return actualPath !== null && hasMatchingNamePath(actualPath, expectedPath);
}

/**
 * Returns true when two callee name paths match exactly by segment and length.
 *
 * @param actualPath - Resolved callee name path.
 * @param expectedPath - Expected callee name path.
 * @returns True when both paths match exactly.
 */
function hasMatchingNamePath(
  actualPath: ReadonlyArray<string>,
  expectedPath: ReadonlyArray<string>,
): boolean {
  if (actualPath.length !== expectedPath.length) {
    return false;
  }
  for (let index = 0; index < actualPath.length; index += 1) {
    if (actualPath[index] !== expectedPath[index]) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true when a call-expression argument is a string literal.
 *
 * @param argument - Call-expression argument to inspect.
 * @returns True when the argument is a string literal.
 */
function isStringLiteralArgument(
  argument: TSESTree.CallExpressionArgument | null,
): argument is StringLiteralArgument {
  return argument?.type === AST_NODE_TYPES.Literal && isString(argument.value);
}
