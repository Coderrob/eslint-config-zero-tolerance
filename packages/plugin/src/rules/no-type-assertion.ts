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
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { isTestFile } from '../helpers/ast-guards';
import { TYPE_ASSERTION_ALLOWED_IN_TESTS } from './support/rule-constants';
import { createRule } from './support/rule-factory';

enum NoTypeAssertionMessageId {
  NoTypeAssertion = 'noTypeAssertion',
  UseSatisfies = 'useSatisfies',
}
type NoTypeAssertionContext = Readonly<TSESLint.RuleContext<NoTypeAssertionMessageId, []>>;

/**
 * Checks a TypeScript assertion expression for validity.
 *
 * @param context - ESLint rule execution context.
 * @param node - Type assertion node to inspect.
 */
function checkTypeAssertion(
  context: Readonly<NoTypeAssertionContext>,
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): void {
  const typeText = context.sourceCode.getText(node.typeAnnotation);
  if (isTestFile(context.filename) && typeText.trim() === TYPE_ASSERTION_ALLOWED_IN_TESTS) {
    return;
  }
  const suggestions = createSatisfiesSuggestions(context.sourceCode, node);
  context.report({
    node,
    messageId: NoTypeAssertionMessageId.NoTypeAssertion,
    data: { assertion: getAssertionSyntax(node, typeText) },
    ...(suggestions.length > 0 ? { suggest: suggestions } : {}),
  });
}

/**
 * Creates listeners for no-type-assertion rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoTypeAssertionListeners(
  context: Readonly<NoTypeAssertionContext>,
): TSESLint.RuleListener {
  return {
    TSAsExpression: checkTypeAssertion.bind(undefined, context),
    TSTypeAssertion: checkTypeAssertion.bind(undefined, context),
  };
}

/**
 * Creates a satisfies suggestion for simple variable initializers.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Type assertion node to inspect.
 * @returns Suggestion entries.
 */
function createSatisfiesSuggestions(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): TSESLint.ReportSuggestionArray<NoTypeAssertionMessageId> {
  if (!isSatisfiesSuggestionTarget(node)) {
    return [];
  }
  return [
    {
      messageId: NoTypeAssertionMessageId.UseSatisfies,
      fix: replaceTypeAssertionWithSatisfies.bind(undefined, sourceCode, node),
    },
  ];
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
 * Returns true when an assertion can be suggested as a satisfies expression.
 *
 * @param node - Type assertion node to inspect.
 * @returns True when the assertion is an as-expression variable initializer.
 */
function isSatisfiesSuggestionTarget(
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): node is TSESTree.TSAsExpression {
  return (
    node.type === AST_NODE_TYPES.TSAsExpression &&
    node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
    node.parent.init === node
  );
}

/**
 * Replaces a simple as-expression with a satisfies expression.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - As-expression node to replace.
 * @param fixer - ESLint fixer.
 * @returns Generated replacement fix.
 */
function replaceTypeAssertionWithSatisfies(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSAsExpression>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const expressionText = sourceCode.getText(node.expression);
  const typeText = sourceCode.getText(node.typeAnnotation);
  return fixer.replaceText(node, `${expressionText} satisfies ${typeText}`);
}

/**
 * ESLint rule that prevents use of TypeScript "as" type assertions.
 */
export const noTypeAssertion = createRule({
  name: 'no-type-assertion',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Prevent use of TypeScript "as" type assertions',
    },
    messages: {
      noTypeAssertion: 'Type assertion "{{assertion}}" is not allowed',
      useSatisfies: 'Use satisfies instead of a type assertion.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoTypeAssertionListeners,
});

export default noTypeAssertion;
