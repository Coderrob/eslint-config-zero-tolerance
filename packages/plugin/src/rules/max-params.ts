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

import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { type FunctionNode } from '../ast-guards';
import { resolveFunctionName } from '../ast-helpers';
import { isNumber } from '../type-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);
const MAX_PARAMS_MAX = 4;

/**
 * Returns the configured parameter limit, defaulting to 4.
 *
 * @param options - The rule options array.
 * @returns The maximum allowed number of parameters.
 */
function resolveMax(options: unknown[]): number {
  const opt = options[0] as { max?: unknown } | undefined;
  const max = opt?.max;
  return isNumber(max) && max > 0 ? max : MAX_PARAMS_MAX;
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
  create(context) {
    const max = resolveMax(context.options);

    /**
     * Checks a function node for parameter count violations.
     *
     * @param node - The function node to check.
     */
    function checkFunction(node: FunctionNode): void {
      const count = node.params.length;
      if (count <= max) {
        return;
      }
      context.report({
        node,
        messageId: 'tooManyParams',
        data: { name: resolveFunctionName(node), count, max },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});

export default maxParams;
