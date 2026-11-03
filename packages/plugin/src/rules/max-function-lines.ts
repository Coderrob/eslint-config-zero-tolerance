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
import { type FunctionNode } from '../helpers/ast-guards';
import { getOptionMaxValue, resolveFunctionName } from '../helpers/ast-helpers';
import { isNumber } from '../helpers/type-guards';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

const DEFAULT_MAX_FUNCTION_LINES = 30;

interface IMaxFunctionLinesOptions {
  max?: number;
  skipBlankLines?: boolean;
  skipComments?: boolean;
}

type MaxFunctionLinesContext = Readonly<
  TSESLint.RuleContext<'tooManyLines', [IMaxFunctionLinesOptions?]>
>;

/**
 * Counts body lines, optionally excluding blank and comment-only lines.
 * @param context - ESLint rule context.
 * @param body - Input body for this operation.
 * @returns The result of the described check or resolution.
 */
function countBodyLines(
  context: Readonly<MaxFunctionLinesContext>,
  body: Readonly<TSESTree.Node>,
): number {
  const options = context.options[0];
  const lines = context.sourceCode.lines.slice(body.loc.start.line - 1, body.loc.end.line);
  const comments = context.sourceCode.getAllComments();
  return lines.filter((line, offset) =>
    isCountedLine(line, body.loc.start.line + offset, comments, options),
  ).length;
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
 * Checks whether a comment intersects a source line.
 * @param comment - Comment whose range is inspected.
 * @param lineNumber - One-based source line number.
 * @returns The result of the described check or resolution.
 */
function isCommentLine(comment: Readonly<TSESTree.Comment>, lineNumber: number): boolean {
  return lineNumber >= comment.loc.start.line && lineNumber <= comment.loc.end.line;
}

/**
 * Determines whether one source line contributes to the function limit.
 * @param line - Source line text.
 * @param lineNumber - One-based source line number.
 * @param comments - Parsed source comments.
 * @param options - Configured rule options.
 * @returns The result of the described check or resolution.
 */
function isCountedLine(
  line: string,
  lineNumber: number,
  comments: readonly TSESTree.Comment[],
  options: IMaxFunctionLinesOptions | undefined,
): boolean {
  const settings = options ?? {};
  if (line.trim() === '') return settings.skipBlankLines !== true;
  return (
    settings.skipComments !== true || removeLineComments(line, lineNumber, comments).trim() !== ''
  );
}

/**
 * Removes a single comment's intersection with a source line.
 * @param line - Source line text.
 * @param lineNumber - One-based source line number.
 * @param comment - Comment whose range is inspected.
 * @returns The result of the described check or resolution.
 */
function removeCommentSegment(
  line: string,
  lineNumber: number,
  comment: Readonly<TSESTree.Comment>,
): string {
  if (!isCommentLine(comment, lineNumber)) return line;
  const start = lineNumber === comment.loc.start.line ? comment.loc.start.column : 0;
  const end = lineNumber === comment.loc.end.line ? comment.loc.end.column : line.length;
  return line.slice(0, start) + line.slice(end);
}

/**
 * Removes only comment ranges while preserving code on the same line.
 * @param line - Source line text.
 * @param lineNumber - One-based source line number.
 * @param comments - Parsed source comments.
 * @returns The result of the described check or resolution.
 */
function removeLineComments(
  line: string,
  lineNumber: number,
  comments: readonly TSESTree.Comment[],
): string {
  return comments.reduceRight(
    (text, comment) => removeCommentSegment(text, lineNumber, comment),
    line,
  );
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
  const lineCount = countBodyLines(context, node.body);
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
      description:
        'Limit block and expression function bodies with optional blank/comment exclusions',
    },
    messages: {
      tooManyLines:
        'Function "{{name}}" has {{lines}} lines (max {{max}}); keep functions small and focused',
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 1 },
          skipBlankLines: { type: 'boolean' },
          skipComments: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: resolveListeners,
});

export default maxFunctionLines;
