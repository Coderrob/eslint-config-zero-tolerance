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
import { getMappedMemberPropertyName } from '../helpers/ast-helpers';
import { createRule } from './support/rule-factory';

const BANNED_MOCK_METHODS: Record<string, string> = {
  mockImplementation: 'mockImplementationOnce',
  mockReturnValue: 'mockReturnValueOnce',
  mockResolvedValue: 'mockResolvedValueOnce',
  mockRejectedValue: 'mockRejectedValueOnce',
};

type NoMockImplementationContext = Readonly<TSESLint.RuleContext<'noMockImplementation', []>>;

/**
 * Checks member expressions for banned mock methods.
 *
 * @param context - ESLint rule execution context.
 * @param node - Member expression node to inspect.
 */
function checkMemberExpression(
  context: NoMockImplementationContext,
  node: TSESTree.MemberExpression,
): void {
  const bannedMethod = getMappedMemberPropertyName(node, BANNED_MOCK_METHODS);
  if (bannedMethod === null) {
    return;
  }

  context.report({
    node: node.property,
    messageId: 'noMockImplementation',
    data: {
      method: bannedMethod.name,
      replacement: bannedMethod.replacement,
    },
  });
}

/**
 * Creates listeners for banned mock method usage.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoMockImplementationListeners(
  context: NoMockImplementationContext,
): TSESLint.RuleListener {
  return {
    MemberExpression: checkMemberExpression.bind(undefined, context),
  };
}

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
  create: createNoMockImplementationListeners,
});

export default noMockImplementation;
