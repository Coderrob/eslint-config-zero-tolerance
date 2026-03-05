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
import { TYPE_ASSERTION_ALLOWED_IN_TESTS } from '../rule-constants';
import { isTestFile } from '../ast-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that prevents use of TypeScript "as" type assertions.
 */
export const noTypeAssertion = createRule({
  name: 'no-type-assertion',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent use of TypeScript "as" type assertions',
    },
    messages: {
      noTypeAssertion: 'Type assertion "as {{type}}" is not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that prevents TypeScript type assertions.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a TypeScript "as" expression for validity.
     *
     * @param node - The TSAsExpression node to check.
     */
    const checkTSAsExpression = (node: TSESTree.TSAsExpression): void => {
      const filename = context.filename;
      const typeText = context.sourceCode.getText(node.typeAnnotation);

      // Allow specific type assertions in test files
      if (isTestFile(filename) && typeText.trim() === TYPE_ASSERTION_ALLOWED_IN_TESTS) {
        return;
      }

      context.report({
        node,
        messageId: 'noTypeAssertion',
        data: { type: typeText },
      });
    };

    return {
      TSAsExpression: checkTSAsExpression,
    };
  },
});

export default noTypeAssertion;
