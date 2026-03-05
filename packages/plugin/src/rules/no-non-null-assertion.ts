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

/**
 * ESLint rule that disallows non-null assertions using the "!" postfix operator.
 */
export const noNonNullAssertion = createRule({
  name: 'no-non-null-assertion',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow non-null assertions using the "!" postfix operator',
    },
    messages: {
      noNonNullAssertion:
        'Non-null assertion "!" bypasses TypeScript\'s type safety; use optional chaining or a proper null check instead',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that prevents TypeScript non-null assertions.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a TypeScript non-null expression.
     *
     * @param node - The TSNonNullExpression node to check.
     */
    const checkTSNonNullExpression = (node: TSESTree.TSNonNullExpression): void => {
      context.report({ node, messageId: 'noNonNullAssertion' });
    };

    return {
      TSNonNullExpression: checkTSNonNullExpression,
    };
  },
});

export default noNonNullAssertion;
