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

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const CHECKED_BINARY_OPERATORS = new Set([
  '===',
  '!==',
  '==',
  '!=',
  '&&',
  '||',
  '??',
  '+',
  '-',
  '/',
  '%',
]);

/**
 * ESLint rule that detects identical expressions in binary operations.
 */
export const noIdenticalExpressions = createRule({
  name: 'no-identical-expressions',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow identical expressions on both sides of a binary or logical operator (Sonar S1764)',
    },
    messages: {
      identicalExpressions:
        'Identical expressions on both sides of "{{operator}}" are always a bug; check for a copy-paste error',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that detects identical expressions in binary/logical operations.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Checks a binary or logical expression for identical operands.
     *
     * @param node - The expression node to check.
     */
    const checkExpression = (
      node: TSESTree.BinaryExpression | TSESTree.LogicalExpression,
    ): void => {
      if (!CHECKED_BINARY_OPERATORS.has(node.operator)) {
        return;
      }

      const leftText = sourceCode.getText(node.left);
      const rightText = sourceCode.getText(node.right);

      if (leftText !== rightText) {
        return;
      }

      context.report({
        node,
        messageId: 'identicalExpressions',
        data: { operator: node.operator },
      });
    };

    return {
      BinaryExpression: checkExpression,
      LogicalExpression: checkExpression,
    };
  },
});

export default noIdenticalExpressions;
