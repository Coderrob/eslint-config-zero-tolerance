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
import { isInsideBoundary } from '../helpers/ast/navigation';
import { createRule } from './support/rule-factory';

interface INoAwaitInLoopOptions {
  allowedFunctionNames?: readonly string[];
  allowForAwaitOf?: boolean;
}

type NoAwaitInLoopContext = Readonly<
  TSESLint.RuleContext<'noAwaitInLoop', [INoAwaitInLoopOptions?]>
>;

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
 * Tests the async-iterator exception without treating ordinary loops as sequential.
 * @param node - AST node to inspect.
 * @param options - Configured rule options.
 * @returns The result of the described check or resolution.
 */
function isAllowedAsyncIterator(
  node: Readonly<TSESTree.Node>,
  options: Readonly<INoAwaitInLoopOptions>,
): boolean {
  return (
    options.allowForAwaitOf === true && node.type === AST_NODE_TYPES.ForOfStatement && node.await
  );
}

/**
 * Matches a sequential function's declared name or variable binding.
 * @param node - AST node to inspect.
 * @param names - Configured function names.
 * @returns The result of the described check or resolution.
 */
function isAllowedFunction(node: Readonly<TSESTree.Node>, names: readonly string[]): boolean {
  return names.includes(sequentialFunctionName(node)) || names.includes(variableFunctionName(node));
}

/**
 * Allows explicitly configured sequential functions and async iterator loops.
 * @param context - ESLint rule context.
 * @param ancestors - Enclosing nodes in traversal order.
 * @returns The result of the described check or resolution.
 */
function isAllowedSequentialAwait(
  context: Readonly<NoAwaitInLoopContext>,
  ancestors: readonly TSESTree.Node[],
): boolean {
  const options = context.options[0] ?? {};
  const boundary = lastSequentialBoundary(ancestors, options);
  return boundary !== null && isSequentialException(boundary, options);
}

/**
 * Identifies the nearest function or explicitly allowed async iterator.
 * @param node - AST node to inspect.
 * @param options - Configured rule options.
 * @returns The result of the described check or resolution.
 */
function isSequentialBoundary(
  node: Readonly<TSESTree.Node>,
  options: Readonly<INoAwaitInLoopOptions>,
): boolean {
  if (FUNCTION_BOUNDARY_TYPES.has(node.type)) return true;
  return isAllowedAsyncIterator(node, options);
}

/**
 * Checks the configured exception at the current function boundary.
 * @param node - AST node to inspect.
 * @param options - Configured rule options.
 * @returns The result of the described check or resolution.
 */
function isSequentialException(
  node: Readonly<TSESTree.Node>,
  options: Readonly<INoAwaitInLoopOptions>,
): boolean {
  return (
    node.type === AST_NODE_TYPES.ForOfStatement ||
    isAllowedFunction(node, options.allowedFunctionNames ?? [])
  );
}

/**
 * Returns the innermost sequential boundary, if present.
 * @param ancestors - Enclosing AST nodes in traversal order.
 * @param options - Configured rule options.
 * @returns The result of the described check or resolution.
 */
function lastSequentialBoundary(
  ancestors: readonly TSESTree.Node[],
  options: Readonly<INoAwaitInLoopOptions>,
): TSESTree.Node | null {
  return ancestors.reduce<TSESTree.Node | null>(
    (last, node) => (isSequentialBoundary(node, options) ? node : last),
    null,
  );
}

/**
 * Reports await-in-loop violations for await expression nodes.
 *
 * @param context - ESLint rule execution context.
 * @param node - Await expression node to evaluate.
 */
function reportAwaitExpressionInLoop(
  context: Readonly<NoAwaitInLoopContext>,
  node: Readonly<TSESTree.AwaitExpression>,
): void {
  const ancestors = context.sourceCode.getAncestors(node);
  if (isAllowedSequentialAwait(context, ancestors)) return;
  if (isInsideBoundary(ancestors, LOOP_TYPES, FUNCTION_BOUNDARY_TYPES)) {
    context.report({ node, messageId: 'noAwaitInLoop' });
  }
}

/**
 * Creates listeners for no-await-in-loop rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function resolveListeners(context: Readonly<NoAwaitInLoopContext>): TSESLint.RuleListener {
  return {
    AwaitExpression: reportAwaitExpressionInLoop.bind(undefined, context),
  };
}

/**
 * Finds the name of a declared function or function-valued variable.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function sequentialFunctionName(node: Readonly<TSESTree.Node>): string {
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression
  ) {
    if (node.id !== null) return node.id.name;
  }
  return variableFunctionName(node);
}

/**
 * Reads a function-valued variable name.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function variableFunctionName(node: Readonly<TSESTree.Node>): string {
  const parent = node.parent;
  if (parent?.type !== AST_NODE_TYPES.VariableDeclarator) return '';
  return parent.id.type === AST_NODE_TYPES.Identifier ? parent.id.name : '';
}

/**
 * ESLint rule that disallows await expressions inside loops.
 */
export const noAwaitInLoop = createRule({
  name: 'no-await-in-loop',
  meta: {
    type: 'problem',
    docs: {
      description: 'Review await inside loops with configurable sequential-work exceptions',
    },
    messages: {
      noAwaitInLoop:
        'Review sequential await: use bounded concurrency for independent work, or configure an exception for ordering, retries, pagination, or rate limits.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedFunctionNames: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          allowForAwaitOf: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: resolveListeners,
});

export default noAwaitInLoop;
