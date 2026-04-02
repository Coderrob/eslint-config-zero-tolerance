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
 * Higher-level AST statement helpers for return and boolean-literal evaluation.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

const FIRST_ITEM_INDEX = 0;
const SINGLE_ITEM_COUNT = 1;

/**
 * Returns the boolean literal value from a return-bearing statement.
 *
 * @param statement - Statement to inspect.
 * @returns Boolean value, or null when the statement is not a boolean return.
 */
export function getBooleanLiteralReturnValue(statement: TSESTree.Statement | null): boolean | null {
  const returnStatement = getReturnStatement(statement);
  return returnStatement === null ? null : getBooleanLiteralValue(returnStatement.argument);
}

/**
 * Returns the boolean literal value from an expression.
 *
 * @param value - Expression to inspect.
 * @returns Boolean value, or null when the expression is not a boolean literal.
 */
export function getBooleanLiteralValue(value: TSESTree.Expression | null): boolean | null {
  if (value?.type !== AST_NODE_TYPES.Literal) {
    return null;
  }
  return typeof value.value === 'boolean' ? value.value : null;
}

/**
 * Returns a return statement from either a direct return statement or a block
 * containing exactly one return statement.
 *
 * @param statement - Statement to inspect.
 * @returns Return statement, or null when no direct or single-block return exists.
 */
export function getReturnStatement(
  statement: TSESTree.Statement | null,
): TSESTree.ReturnStatement | null {
  if (statement === null) {
    return null;
  }
  if (statement.type === AST_NODE_TYPES.ReturnStatement) {
    return statement;
  }
  return statement.type === AST_NODE_TYPES.BlockStatement
    ? getSingleReturnStatement(statement)
    : null;
}

/**
 * Returns a return statement when a block contains exactly one statement and
 * that statement is a return statement.
 *
 * @param blockStatement - Block statement to inspect.
 * @returns Contained return statement, or null when the block does not match.
 */
export function getSingleReturnStatement(
  blockStatement: TSESTree.BlockStatement,
): TSESTree.ReturnStatement | null {
  if (blockStatement.body.length !== SINGLE_ITEM_COUNT) {
    return null;
  }
  const statement = blockStatement.body[FIRST_ITEM_INDEX];
  return statement.type === AST_NODE_TYPES.ReturnStatement ? statement : null;
}
