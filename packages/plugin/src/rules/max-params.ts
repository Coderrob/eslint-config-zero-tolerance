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

import { ESLintUtils, TSESLint } from '@typescript-eslint/utils';
import { type FunctionNode } from '../ast-guards';
import { resolveFunctionName } from '../ast-helpers';
import { RULE_CREATOR_URL } from '../constants';
import { isNumber } from '../type-guards';

const MAX_PARAMS_MAX = 4;

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
 * Returns the documentation URL for a rule.
 *
 * @param name - Rule name.
 * @returns Full rule documentation URL.
 */
function getRuleDocumentationUrl(name: string): string {
  return `${RULE_CREATOR_URL}${name}`;
}

const createRule = ESLintUtils.RuleCreator(getRuleDocumentationUrl);

/**
 * Reports when a function exceeds the configured parameter limit.
 *
 * @param context - ESLint rule execution context.
 * @param maxParamsCount - Configured maximum parameter count.
 * @param node - Function-like node to check.
 */
function reportIfTooManyParams(
  context: Readonly<TSESLint.RuleContext<'tooManyParams', []>>,
  maxParamsCount: number,
  node: FunctionNode,
): void {
  const parameterCount = node.params.length;
  if (parameterCount > maxParamsCount) {
    context.report({
      node,
      messageId: 'tooManyParams',
      data: { name: resolveFunctionName(node), count: parameterCount, max: maxParamsCount },
    });
  }
}

/**
 * Creates listeners for max-params rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function resolveListeners(
  context: Readonly<TSESLint.RuleContext<'tooManyParams', []>>,
): TSESLint.RuleListener {
  const maxParamsCount = resolveMax(context.options);
  return {
    ArrowFunctionExpression: reportIfTooManyParams.bind(undefined, context, maxParamsCount),
    FunctionDeclaration: reportIfTooManyParams.bind(undefined, context, maxParamsCount),
    FunctionExpression: reportIfTooManyParams.bind(undefined, context, maxParamsCount),
  };
}

/**
 * Returns the configured parameter limit, defaulting to 4.
 *
 * @param options - The rule options array.
 * @returns The maximum allowed number of parameters.
 */
function resolveMax(options: unknown[]): number {
  const maxValue = getOptionMaxValue(options[0]);
  return isNumber(maxValue) && maxValue > 0 ? maxValue : MAX_PARAMS_MAX;
}

/**
 * ESLint rule that enforces a maximum number of function parameters.
 */
export const maxParams = createRule({
  name: 'max-params',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum number of function parameters',
    },
    messages: {
      tooManyParams:
        'Function "{{name}}" has {{count}} parameters (max {{max}}); use an options object to reduce parameter count',
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'number', minimum: 0 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: resolveListeners,
});

export default maxParams;
