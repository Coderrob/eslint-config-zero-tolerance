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

import type { TSESLint } from '@typescript-eslint/utils';
import type { FunctionNode } from '../../helpers/ast-guards';

/**
 * Creates paired enter/exit listeners for all standard function-like AST node variants.
 *
 * @param enterListener - Listener invoked when entering function-like nodes.
 * @param exitListener - Listener invoked when exiting function-like nodes.
 * @returns Rule listener map.
 */
export function createFunctionNodeEnterExitListeners(
  enterListener: (node: FunctionNode) => void,
  exitListener: (node: FunctionNode) => void,
): TSESLint.RuleListener {
  return {
    ...createFunctionNodeListeners(enterListener),
    'ArrowFunctionExpression:exit': exitListener,
    'FunctionDeclaration:exit': exitListener,
    'FunctionExpression:exit': exitListener,
  };
}

/**
 * Creates listeners for all standard function-like AST node variants.
 *
 * @param listener - Listener invoked for arrow functions, function declarations, and function expressions.
 * @returns Rule listener map.
 */
export function createFunctionNodeListeners(
  listener: (node: FunctionNode) => void,
): TSESLint.RuleListener {
  return {
    ArrowFunctionExpression: listener,
    FunctionDeclaration: listener,
    FunctionExpression: listener,
  };
}
