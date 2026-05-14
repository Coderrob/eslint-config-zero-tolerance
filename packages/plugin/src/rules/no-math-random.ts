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
import { isNamedIdentifierNode, isUncomputedMemberExpressionNode } from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

const MATH_IDENTIFIER = 'Math';
const RANDOM_METHOD = 'random';

type NoMathRandomContext = Readonly<TSESLint.RuleContext<'noMathRandom', []>>;

/**
 * Checks call expressions for Math.random usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: Readonly<NoMathRandomContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!isMathRandomCall(node)) {
    return;
  }
  context.report({
    node,
    messageId: 'noMathRandom',
  });
}

/**
 * Creates listeners for Math.random checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoMathRandomListeners(
  context: Readonly<NoMathRandomContext>,
): TSESLint.RuleListener {
  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/**
 * Returns true when a call expression targets `Math.random`.
 *
 * @param node - Call expression node to inspect.
 * @returns True when the callee is `Math.random`.
 */
function isMathRandomCall(node: Readonly<TSESTree.CallExpression>): boolean {
  if (!isUncomputedMemberExpressionNode(node.callee)) {
    return false;
  }
  return (
    isNamedIdentifierNode(node.callee.object, MATH_IDENTIFIER) &&
    isNamedIdentifierNode(node.callee.property, RANDOM_METHOD)
  );
}

/** ESLint rule that disallows Math.random for deterministic behavior. */
export const noMathRandom = createRule({
  name: 'no-math-random',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Math.random(); inject randomness explicitly or use a dedicated random source',
    },
    messages: {
      noMathRandom:
        'Avoid Math.random(); inject a random source or use a dedicated generator instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoMathRandomListeners,
});

export default noMathRandom;
