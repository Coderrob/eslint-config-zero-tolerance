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
import { createRule } from './support/rule-factory';

type NoIndexedAccessTypesContext = Readonly<TSESLint.RuleContext<'noIndexedAccessTypes', []>>;

/**
 * Creates listeners that report TypeScript indexed access types.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoIndexedAccessTypesListeners(
  context: NoIndexedAccessTypesContext,
): TSESLint.RuleListener {
  return {
    TSIndexedAccessType: reportIndexedAccessType.bind(undefined, context),
  };
}

/**
 * Reports a TypeScript indexed access type.
 *
 * @param context - ESLint rule execution context.
 * @param node - Indexed access type node to report.
 */
function reportIndexedAccessType(
  context: NoIndexedAccessTypesContext,
  node: TSESTree.TSIndexedAccessType,
): void {
  context.report({
    node,
    messageId: 'noIndexedAccessTypes',
  });
}

/**
 * ESLint rule that disallows TypeScript indexed access types.
 */
export const noIndexedAccessTypes = createRule({
  name: 'no-indexed-access-types',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow TypeScript indexed access types',
    },
    messages: {
      noIndexedAccessTypes:
        'Indexed access types are not allowed; extract an explicit named type instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoIndexedAccessTypesListeners,
});

export default noIndexedAccessTypes;
