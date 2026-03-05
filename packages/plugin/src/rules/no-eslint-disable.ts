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
import { ESLINT_DISABLE_PREFIX } from '../rule-constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that prevents use of eslint-disable comments.
 */
export const noEslintDisable = createRule({
  name: 'no-eslint-disable',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent use of eslint-disable comments',
    },
    messages: {
      noEslintDisable: 'ESLint disable comments are not allowed; fix the underlying issue instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      /**
       * Checks the program for eslint-disable comments.
       */
      Program() {
        const sourceCode = context.sourceCode;
        const comments = sourceCode.getAllComments();
        for (const comment of comments) {
          const value = comment.value.trim();
          if (value.startsWith(ESLINT_DISABLE_PREFIX)) {
            context.report({
              loc: comment.loc,
              messageId: 'noEslintDisable',
            });
          }
        }
      },
    };
  },
});

export default noEslintDisable;
