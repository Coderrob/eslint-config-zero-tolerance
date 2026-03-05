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
import { getMemberPropertyName } from '../ast-helpers';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const BANNED_MOCK_METHODS: Record<string, string> = {
  mockImplementation: 'mockImplementationOnce',
  mockReturnValue: 'mockReturnValueOnce',
  mockResolvedValue: 'mockResolvedValueOnce',
  mockRejectedValue: 'mockRejectedValueOnce',
};

/**
 * ESLint rule that prohibits persistent mock implementations in favor of Once variants.
 */
export const noMockImplementation = createRule({
  name: 'no-mock-implementation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prohibit persistent mock implementations; use the Once variants to avoid test bleeds',
    },
    messages: {
      noMockImplementation:
        '"{{method}}" is not allowed; use "{{replacement}}" to avoid test bleeds',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      /**
       * Checks member expressions for banned mock methods.
       *
       * @param node - The member expression node to check.
       */
      MemberExpression(node) {
        const name = getMemberPropertyName(node);
        if (!name) {
          return;
        }

        const replacement = BANNED_MOCK_METHODS[name];
        if (!replacement) {
          return;
        }

        context.report({
          node: node.property,
          messageId: 'noMockImplementation',
          data: {
            method: name,
            replacement,
          },
        });
      },
    };
  },
});

export default noMockImplementation;
