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
import { isIdentifierNode } from '../ast-guards';
import { RULE_CREATOR_URL } from '../constants';
import { RETURN_TYPE_NAME } from '../rule-constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

export const noBannedTypes = createRule({
  name: 'no-banned-types',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban ReturnType and indexed access types',
    },
    messages: {
      bannedReturnType: 'ReturnType is not allowed',
      bannedIndexedAccess: 'Indexed access types are not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that bans ReturnType and indexed access types.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    return {
      /**
       * Checks TypeScript type references for banned types.
       *
       * @param node - The TSTypeReference node to check.
       */
      TSTypeReference(node) {
        // Check for ReturnType
        if (isIdentifierNode(node.typeName) && node.typeName.name === RETURN_TYPE_NAME) {
          context.report({
            node,
            messageId: 'bannedReturnType',
          });
        }
      },
      /**
       * Checks TypeScript indexed access types (all are banned).
       *
       * @param node - The TSIndexedAccessType node to check.
       */
      TSIndexedAccessType(node) {
        // Ban all indexed access types
        context.report({
          node,
          messageId: 'bannedIndexedAccess',
        });
      },
    };
  },
});

export default noBannedTypes;
