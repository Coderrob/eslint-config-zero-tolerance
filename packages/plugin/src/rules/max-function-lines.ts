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
import { type FunctionNode, isBlockStatementNode } from '../helpers/ast-guards';
import { getOptionMaxValue, resolveFunctionName } from '../helpers/ast-helpers';
import { isNumber } from '../helpers/type-guards';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

const DEFAULT_MAX_FUNCTION_LINES = 30;

type MaxFunctionLinesContext = Readonly<TSESLint.RuleContext<'tooManyLines', []>>;

/**
 * Counts the lines occupied by a block-statement function body.
 *
 * @param body - The block statement to count lines for.
 * @returns The number of lines in the block statement.
 */
function countBodyLines(body: Readonly<TSESTree.BlockStatement>): number {
  return body.loc.end.line - body.loc.start.line + 1;
}

/**
 * Returns block body for function nodes, or null for expression-bodied arrows.
 *
 * @param node - Function node to inspect.
 * @returns Block body when present, otherwise null.
 */
function getBlockBody(node: Readonly<FunctionNode>): TSESTree.BlockStatement | null {
  return isBlockStatementNode(node.body) ? node.body : null;
}

/**
 * Resolves a numeric max value from the first rule option.
 *
 * @param options - Raw rule options.
 * @returns Configured maximum, or the default.
 */
function getConfiguredMaxValue(options: readonly unknown[]): number {
  const firstOption = options[0];
  const maxValue = getOptionMaxValue(firstOption);
  return isNumber(maxValue) && maxValue > 0 ? maxValue : DEFAULT_MAX_FUNCTION_LINES;
}

/**
 * Reports a function-line-count violation.
 *
 * @param context - ESLint rule execution context.
 * @param node - Function-like node that violated the limit.
 * @param lineCount - Measured line count.
 * @param maxLines - Configured maximum line count.
 */
function reportFunctionLineViolation(
  context: Readonly<MaxFunctionLinesContext>,
  node: Readonly<FunctionNode>,
  lineCount: number,
  maxLines: number,
): void {
  context.report({
    node,
    messageId: 'tooManyLines',
    data: { name: resolveFunctionName(node), lines: lineCount, max: maxLines },
  });
}

/**
 * Reports when a function's block body exceeds the configured max.
 *
 * @param context - ESLint rule execution context.
 * @param maxLines - Configured maximum line count.
 * @param node - Function-like node to check.
 */
function reportIfFunctionExceedsLimit(
  context: Readonly<MaxFunctionLinesContext>,
  maxLines: number,
  node: Readonly<FunctionNode>,
): void {
  const blockBody = getBlockBody(node);
  if (blockBody === null) {
    return;
  }
  const lineCount = countBodyLines(blockBody);
  if (lineCount > maxLines) {
    reportFunctionLineViolation(context, node, lineCount, maxLines);
  }
}

/**
 * Creates listeners for max-function-lines rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function resolveListeners(context: Readonly<MaxFunctionLinesContext>): TSESLint.RuleListener {
  const maxLines = getConfiguredMaxValue(context.options);
  return createFunctionNodeListeners(
    reportIfFunctionExceedsLimit.bind(undefined, context, maxLines),
  );
}

/**
 * ESLint rule that enforces a maximum number of lines per function body.
 */
export const maxFunctionLines = createRule({
  name: 'max-function-lines',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum number of lines per function body',
    },
    messages: {
      tooManyLines:
        'Function "{{name}}" has {{lines}} lines (max {{max}}); keep functions small and focused',
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'number', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: resolveListeners,
});

export default maxFunctionLines;
