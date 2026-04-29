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
import { isTestFile } from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

type NoTestInterfaceDeclarationContext = Readonly<
  TSESLint.RuleContext<'noTestInterfaceDeclaration', []>
>;

/**
 * Creates listeners that report interface declarations inside test files.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoTestInterfaceDeclarationListeners(
  context: Readonly<NoTestInterfaceDeclarationContext>,
): TSESLint.RuleListener {
  if (!isTestFile(context.filename)) {
    return {};
  }

  return {
    TSInterfaceDeclaration: reportInterfaceDeclaration.bind(undefined, context),
  };
}

/**
 * Reports an interface declaration found in a test file.
 *
 * @param context - ESLint rule execution context.
 * @param node - The interface declaration node.
 */
function reportInterfaceDeclaration(
  context: Readonly<NoTestInterfaceDeclarationContext>,
  node: Readonly<TSESTree.TSInterfaceDeclaration>,
): void {
  context.report({
    node: node.id,
    messageId: 'noTestInterfaceDeclaration',
    data: { name: node.id.name },
  });
}

/**
 * ESLint rule that disallows interface declarations in test files.
 */
export const noTestInterfaceDeclaration = createRule({
  name: 'no-test-interface-declaration',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow interface declarations in test files; import production types instead',
    },
    messages: {
      noTestInterfaceDeclaration:
        'Interface "{{name}}" should not be declared in a test file; define it in production code and import it instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoTestInterfaceDeclarationListeners,
});

export default noTestInterfaceDeclaration;
