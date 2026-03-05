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
 * ESLint rule that disallows empty catch blocks.
 */
export const noEmptyCatch = createRule({
  name: 'no-empty-catch',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow empty catch blocks that silently swallow errors',
    },
    messages: {
      emptyCatch: 'Empty catch block silently swallows errors; handle or re-throw the error',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that detects empty catch blocks.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a catch clause for empty body.
     *
     * @param node - The catch clause node to check.
     */
    const checkCatchClause = (node: TSESTree.CatchClause): void => {
      if (node.body.body.length === 0) {
        context.report({ node, messageId: 'emptyCatch' });
      }
    };

    return {
      CatchClause: checkCatchClause,
    };
  },
});

export default noEmptyCatch;
