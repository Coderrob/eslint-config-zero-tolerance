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

import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isTestFile } from '../ast-guards';
import { TYPE_ASSERTION_ALLOWED_IN_TESTS } from '../rule-constants';
import { createRule } from '../rule-factory';

type NoTypeAssertionContext = Readonly<TSESLint.RuleContext<'noTypeAssertion', []>>;

/**
 * Checks a TypeScript assertion expression for validity.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type assertion node to inspect.
 */
function checkTypeAssertion(
  context: NoTypeAssertionContext,
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): void {
  const typeText = context.sourceCode.getText(node.typeAnnotation);
  if (isTestFile(context.filename) && typeText.trim() === TYPE_ASSERTION_ALLOWED_IN_TESTS) {
    return;
  }
  context.report({
    node,
    messageId: 'noTypeAssertion',
    data: { assertion: getAssertionSyntax(node, typeText) },
  });
}

/**
 * Creates listeners for no-type-assertion rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoTypeAssertionListeners(context: NoTypeAssertionContext): TSESLint.RuleListener {
  return {
    TSAsExpression: checkTypeAssertion.bind(undefined, context),
    TSTypeAssertion: checkTypeAssertion.bind(undefined, context),
  };
}

/**
 * Returns the assertion syntax shown in diagnostics.
 *
 * @param node - The assertion node.
 * @param typeText - The asserted type source text.
 * @returns Human-readable assertion syntax text.
 */
function getAssertionSyntax(
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
  typeText: string,
): string {
  if (node.type === AST_NODE_TYPES.TSAsExpression) {
    return `as ${typeText}`;
  }
  return `<${typeText}>`;
}

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
      noTypeAssertion: 'Type assertion "{{assertion}}" is not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoTypeAssertionListeners,
});

export default noTypeAssertion;
