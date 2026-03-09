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
import { type FunctionNode, isBlockStatementNode } from '../ast-guards';
import { resolveFunctionName } from '../ast-helpers';
import { createRule } from '../rule-factory';
import { isNumber } from '../type-guards';

const DEFAULT_MAX_FUNCTION_LINES = 30;

type MaxFunctionLinesContext = Readonly<TSESLint.RuleContext<'tooManyLines', []>>;

/**
 * Counts the lines occupied by a block-statement function body.
 *
 * @param body - The block statement to count lines for.
 * @returns The number of lines in the block statement.
 */
function countBodyLines(body: TSESTree.BlockStatement): number {
  return body.loc.end.line - body.loc.start.line + 1;
}

/**
 * Creates listeners for all function-like nodes.
 *
 * @param context - ESLint rule execution context.
 * @param maxLines - Configured maximum line count.
 * @returns Rule listeners.
 */
function createFunctionListeners(
  context: MaxFunctionLinesContext,
  maxLines: number,
): TSESLint.RuleListener {
  return {
    ArrowFunctionExpression: reportIfFunctionExceedsLimit.bind(undefined, context, maxLines),
    FunctionDeclaration: reportIfFunctionExceedsLimit.bind(undefined, context, maxLines),
    FunctionExpression: reportIfFunctionExceedsLimit.bind(undefined, context, maxLines),
  };
}

/**
 * Returns block body for function nodes, or null for expression-bodied arrows.
 *
 * @param node - Function node to inspect.
 * @returns Block body when present, otherwise null.
 */
function getBlockBody(node: FunctionNode): TSESTree.BlockStatement | null {
  return isBlockStatementNode(node.body) ? node.body : null;
}

/**
 * Resolves a numeric max value from the first rule option.
 *
 * @param options - Raw rule options.
 * @returns Configured maximum, or the default.
 */
function getConfiguredMaxValue(options: unknown[]): number {
  const firstOption = options[0];
  const maxValue = getOptionMaxValue(firstOption);
  return isNumber(maxValue) && maxValue > 0 ? maxValue : DEFAULT_MAX_FUNCTION_LINES;
}

/**
 * Reads the `max` property from an option object.
 *
 * @param option - First rule option value.
 * @returns The raw max value when present, otherwise undefined.
 */
function getOptionMaxValue(option: unknown): unknown {
  if (option === null || typeof option !== 'object') {
    return undefined;
  }
  return Reflect.get(option, 'max');
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
  context: MaxFunctionLinesContext,
  node: FunctionNode,
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
  context: MaxFunctionLinesContext,
  maxLines: number,
  node: FunctionNode,
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
function resolveListeners(context: MaxFunctionLinesContext): TSESLint.RuleListener {
  const maxLines = getConfiguredMaxValue(context.options);
  return createFunctionListeners(context, maxLines);
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
