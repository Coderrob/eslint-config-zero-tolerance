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
import { isString } from '../type-guards';
import { isBinaryExpressionNode, isSwitchCaseNode } from '../ast-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const COMPARISON_OPERATORS = new Set(['===', '!==', '==', '!=']);

/**
 * Returns true when the string literal appears on either side of a
 * comparison expression, which is the primary location where magic strings
 * cause readability and maintenance problems.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in a comparison expression, false otherwise.
 */
function isInComparisonExpression(node: TSESTree.Literal): boolean {
  if (!isBinaryExpressionNode(node.parent)) {
    return false;
  }
  return COMPARISON_OPERATORS.has(node.parent.operator);
}

/**
 * Returns true when the string literal is the test value of a switch-case
 * clause, another common location for magic strings.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in a switch case, false otherwise.
 */
function isInSwitchCase(node: TSESTree.Literal): boolean {
  return isSwitchCaseNode(node.parent) && node.parent.test === node;
}

/**
 * Returns normalized non-empty string literal value, or null when invalid.
 *
 * @param node - The literal node to extract the string value from.
 * @returns The string value if valid, otherwise null.
 */
function getStringValue(node: TSESTree.Literal): string | null {
  if (!isString(node.value)) {
    return null;
  }
  if (node.value === '') {
    return null;
  }
  return node.value;
}

/**
 * Returns true when literal appears in a context where magic strings are forbidden.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in a forbidden context, false otherwise.
 */
function isMagicStringContext(node: TSESTree.Literal): boolean {
  if (isInComparisonExpression(node)) {
    return true;
  }
  return isInSwitchCase(node);
}

/**
 * ESLint rule that disallows magic strings; use named constants instead of raw string literals.
 */
export const noMagicStrings = createRule({
  name: 'no-magic-strings',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow magic strings in comparisons and switch cases; use named constants instead',
    },
    messages: {
      noMagicStrings: 'Magic string "{{value}}" is not allowed; extract it into a named constant',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that detects magic strings in comparisons and switch cases.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a literal node for magic strings.
     *
     * @param node - The literal node to check.
     */
    const checkLiteral = (node: TSESTree.Literal): void => {
      const value = getStringValue(node);
      if (value === null) {
        return;
      }

      if (!isMagicStringContext(node)) {
        return;
      }

      context.report({
        node,
        messageId: 'noMagicStrings',
        data: { value },
      });
    };

    return {
      Literal: checkLiteral,
    };
  },
});

export default noMagicStrings;
