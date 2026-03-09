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
import { createRule } from '../rule-factory';

type NoAwaitInLoopContext = Readonly<TSESLint.RuleContext<'noAwaitInLoop', []>>;

const LOOP_TYPES = new Set([
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.WhileStatement,
  AST_NODE_TYPES.DoWhileStatement,
]);

const FUNCTION_BOUNDARY_TYPES = new Set([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
]);

/**
 * Returns loop-boundary evaluation result for a node type, or null if irrelevant.
 *
 * @param type - AST node type to evaluate.
 * @returns True for loop boundary, false for function boundary, null otherwise.
 */
function getBoundaryResult(type: AST_NODE_TYPES): boolean | null {
  if (FUNCTION_BOUNDARY_TYPES.has(type)) {
    return false;
  }
  return LOOP_TYPES.has(type) ? true : null;
}

/**
 * Walks ancestors from innermost outward and returns true when a loop
 * node is reached before any function boundary, indicating the await
 * executes directly inside a loop body rather than inside a nested function.
 *
 * @param ancestors - The array of ancestor nodes from innermost to outermost.
 * @returns True if the await is inside a loop, false otherwise.
 */
function isInsideLoop(ancestors: TSESTree.Node[]): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const boundaryResult = getBoundaryResult(ancestors[i].type);
    if (boundaryResult !== null) {
      return boundaryResult;
    }
  }
  return false;
}

/**
 * Reports await-in-loop violations for await expression nodes.
 *
 * @param context - ESLint rule execution context.
 * @param node - Await expression node to evaluate.
 */
function reportAwaitExpressionInLoop(
  context: NoAwaitInLoopContext,
  node: TSESTree.AwaitExpression,
): void {
  const ancestors = context.sourceCode.getAncestors(node);
  if (isInsideLoop(ancestors)) {
    context.report({ node, messageId: 'noAwaitInLoop' });
  }
}

/**
 * Creates listeners for no-await-in-loop rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function resolveListeners(context: NoAwaitInLoopContext): TSESLint.RuleListener {
  return {
    AwaitExpression: reportAwaitExpressionInLoop.bind(undefined, context),
  };
}

/**
 * ESLint rule that disallows await expressions inside loops.
 */
export const noAwaitInLoop = createRule({
  name: 'no-await-in-loop',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow await expressions inside loops; use Promise.all() for parallel execution',
    },
    messages: {
      noAwaitInLoop:
        'Unexpected await inside a loop; refactor to use Promise.all() or Promise.allSettled() for parallel execution',
    },
    schema: [],
  },
  defaultOptions: [],
  create: resolveListeners,
});

export default noAwaitInLoop;
