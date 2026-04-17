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
import {
  isCallExpressionNode,
  isNamedIdentifierNode,
  isUncomputedMemberExpressionNode,
} from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

const JSON_IDENTIFIER = 'JSON';
const JSON_PARSE_METHOD = 'parse';
const JSON_STRINGIFY_METHOD = 'stringify';
const STRUCTURED_CLONE_IDENTIFIER = 'structuredClone';

type PreferStructuredCloneContext = Readonly<TSESLint.RuleContext<'preferStructuredClone', []>>;

/**
 * Builds the replacement text for a `structuredClone(...)` autofix.
 *
 * @param sourceCode - ESLint source-code helper.
 * @param node - Matching JSON.parse(JSON.stringify(...)) call.
 * @returns Replacement text, or null when the node no longer matches.
 */
function buildStructuredCloneReplacement(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.CallExpression,
): string | null {
  const clonedValue = getClonedValue(node);
  /* istanbul ignore next -- fixer is created only after the node matches exactly */
  if (clonedValue === null) {
    return null;
  }
  return `${STRUCTURED_CLONE_IDENTIFIER}${getTypeArgumentsText(sourceCode, node)}(${getStructuredCloneArgumentText(
    sourceCode,
    clonedValue,
  )})`;
}

/**
 * Checks call expressions for the JSON.parse(JSON.stringify(...)) deep-clone pattern.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: PreferStructuredCloneContext,
  node: TSESTree.CallExpression,
): void {
  if (!isJsonParseOfJsonStringify(node)) {
    return;
  }
  context.report({
    node,
    messageId: 'preferStructuredClone',
    fix: createPreferStructuredCloneFix.bind(undefined, context.sourceCode, node),
  });
}

/**
 * Creates a fixer that rewrites JSON.parse(JSON.stringify(...)) to structuredClone(...).
 *
 * @param sourceCode - ESLint source-code helper.
 * @param node - Matching parse call.
 * @param fixer - ESLint fixer helper.
 * @returns Replacement fix, or null when the node no longer matches.
 */
function createPreferStructuredCloneFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.CallExpression,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix | null {
  const replacement = buildStructuredCloneReplacement(sourceCode, node);
  /* istanbul ignore next -- replacement creation is guarded by the reporting predicate */
  if (replacement === null) {
    return null;
  }
  return fixer.replaceText(node, replacement);
}

/**
 * Creates listeners for prefer-structured-clone rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createPreferStructuredCloneListeners(
  context: PreferStructuredCloneContext,
): TSESLint.RuleListener {
  return {
    CallExpression: checkCallExpression.bind(undefined, context),
  };
}

/**
 * Returns the value expression passed through JSON.stringify(...) for cloning.
 *
 * @param node - Candidate JSON.parse call.
 * @returns The cloned value expression, or null when the shape does not match.
 */
function getClonedValue(node: TSESTree.CallExpression): TSESTree.Expression | null {
  const jsonStringifyCall = getNestedJsonStringifyCall(node);
  /* istanbul ignore next -- clone values are only read after the pattern match succeeds */
  return jsonStringifyCall === null ? null : getOnlyExpressionArgument(jsonStringifyCall);
}

/**
 * Returns the nested JSON.stringify(...) call inside JSON.parse(...), or null.
 *
 * @param node - Candidate JSON.parse call.
 * @returns Nested JSON.stringify call when the shape matches exactly.
 */
function getNestedJsonStringifyCall(
  node: TSESTree.CallExpression,
): TSESTree.CallExpression | null {
  const parsedValue = getOnlyExpressionArgument(node);
  return isJsonStringifyCloneSource(parsedValue) ? parsedValue : null;
}

/**
 * Returns the only expression argument for a call, or null when arity differs.
 *
 * @param node - Call expression to inspect.
 * @returns The sole expression argument, or null.
 */
function getOnlyExpressionArgument(node: TSESTree.CallExpression): TSESTree.Expression | null {
  if (node.arguments.length !== 1) {
    return null;
  }
  const [firstArgument] = node.arguments;
  return firstArgument.type === AST_NODE_TYPES.SpreadElement ? null : firstArgument;
}

/**
 * Returns the expression text for a structuredClone argument.
 *
 * Sequence expressions are wrapped so they remain a single argument after autofix.
 *
 * @param sourceCode - ESLint source-code helper.
 * @param node - Expression being cloned.
 * @returns Source text suitable for structuredClone(...).
 */
function getStructuredCloneArgumentText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Expression,
): string {
  const argumentText = sourceCode.getText(node);
  if (node.type !== AST_NODE_TYPES.SequenceExpression) {
    return argumentText;
  }
  const trimmedArgumentText = argumentText.trim();
  /* istanbul ignore next -- preserves already-parenthesized sequence expressions */
  return trimmedArgumentText.startsWith('(') && trimmedArgumentText.endsWith(')')
    ? argumentText
    : `(${argumentText})`;
}

/**
 * Returns the type-argument text for a cloned JSON.parse call.
 *
 * @param sourceCode - ESLint source-code helper.
 * @param node - JSON.parse call expression.
 * @returns Type arguments text, or an empty string when absent.
 */
function getTypeArgumentsText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.CallExpression,
): string {
  return node.typeArguments === undefined ? '' : sourceCode.getText(node.typeArguments);
}

/**
 * Returns true when the call has exactly one non-spread expression argument.
 *
 * @param node - Call expression to inspect.
 * @returns True when the call has a single expression argument.
 */
function hasOnlyExpressionArgument(node: TSESTree.CallExpression): boolean {
  return getOnlyExpressionArgument(node) !== null;
}

/**
 * Returns true when the call expression targets a named JSON method.
 *
 * @param node - Call expression to inspect.
 * @param methodName - Expected JSON method name.
 * @returns True when the callee matches JSON.<methodName>.
 */
function isJsonMethodCall(node: TSESTree.CallExpression, methodName: string): boolean {
  if (!isUncomputedMemberExpressionNode(node.callee)) {
    return false;
  }
  return (
    isNamedIdentifierNode(node.callee.object, JSON_IDENTIFIER) &&
    isNamedIdentifierNode(node.callee.property, methodName)
  );
}

/**
 * Returns true when the call expression is JSON.parse(...).
 *
 * @param node - Call expression to inspect.
 * @returns True when the callee is JSON.parse.
 */
function isJsonParseCall(node: TSESTree.CallExpression): boolean {
  return isJsonMethodCall(node, JSON_PARSE_METHOD);
}

/**
 * Returns true when the call is the JSON.parse(JSON.stringify(...)) deep-clone pattern.
 *
 * @param node - Call expression to inspect.
 * @returns True when the outer and inner JSON calls both match exactly.
 */
function isJsonParseOfJsonStringify(node: TSESTree.CallExpression): boolean {
  return isJsonParseCall(node) && getNestedJsonStringifyCall(node) !== null;
}

/**
 * Returns true when the call expression is JSON.stringify(...).
 *
 * @param node - Call expression to inspect.
 * @returns True when the callee is JSON.stringify.
 */
function isJsonStringifyCall(node: TSESTree.CallExpression): boolean {
  return isJsonMethodCall(node, JSON_STRINGIFY_METHOD);
}

/**
 * Returns true when an expression is JSON.stringify(...) with one value argument.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is a JSON.stringify clone source.
 */
function isJsonStringifyCloneSource(
  node: TSESTree.Expression | null,
): node is TSESTree.CallExpression {
  return (
    node !== null &&
    isCallExpressionNode(node) &&
    isJsonStringifyCall(node) &&
    hasOnlyExpressionArgument(node)
  );
}

/**
 * ESLint rule that prefers structuredClone over JSON.parse(JSON.stringify(...)).
 */
export const preferStructuredClone = createRule({
  name: 'prefer-structured-clone',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Prefer structuredClone(...) over JSON.parse(JSON.stringify(...)) when creating a deep clone',
    },
    messages: {
      preferStructuredClone:
        'Use structuredClone(...) instead of JSON.parse(JSON.stringify(...)) for deep cloning.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferStructuredCloneListeners,
});

export default preferStructuredClone;
