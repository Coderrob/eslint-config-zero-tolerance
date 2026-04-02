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
import { createRule } from './support/rule-factory';

const LOGICAL_AND_OPERATOR = '&&';
const MEMBER_DOT_PREFIX = '.';
const MEMBER_COMPUTED_PREFIX = '[';
const CALL_PREFIX = '(';
const MEMBER_DOT_PREFIX_LENGTH = 1;
const SIMPLE_GUARD_NODE_TYPES = new Set([
  AST_NODE_TYPES.Identifier,
  AST_NODE_TYPES.ThisExpression,
  AST_NODE_TYPES.Super,
]);

type RequireOptionalChainingContext = Readonly<TSESLint.RuleContext<'useOptionalChaining', []>>;

/**
 * Returns optional-chain replacement when suffix is a supported access/call pattern.
 *
 * @param leftText - Source text for the guard expression.
 * @param suffix - Right-side suffix after removing the guard prefix.
 * @returns Optional-chain replacement text, or null if unsupported.
 */
function buildOptionalChainFromSuffix(leftText: string, suffix: string): string | null {
  if (suffix.startsWith(MEMBER_DOT_PREFIX)) {
    return `${leftText}?.${suffix.slice(MEMBER_DOT_PREFIX_LENGTH)}`;
  }
  if (suffix.startsWith(MEMBER_COMPUTED_PREFIX) || suffix.startsWith(CALL_PREFIX)) {
    return `${leftText}?.${suffix}`;
  }
  return null;
}

/**
 * Creates replacement text by inserting `?` between guard and guarded access/call.
 *
 * @param leftText - Source text for the guard expression.
 * @param rightText - Source text for the guarded expression.
 * @returns Optional-chained replacement text, or null when not derivable.
 */
function buildOptionalChainReplacement(leftText: string, rightText: string): string | null {
  if (!rightText.startsWith(leftText)) {
    return null;
  }
  return buildOptionalChainFromSuffix(leftText, rightText.slice(leftText.length).trimStart());
}

/**
 * Reports logical `&&` guard patterns that can be optional chained.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - Logical expression node to evaluate.
 */
function checkLogicalExpression(
  context: RequireOptionalChainingContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.LogicalExpression,
): void {
  const replacement = getOptionalChainReplacement(node, sourceCode);
  if (replacement === null) {
    return;
  }
  context.report({
    node,
    messageId: 'useOptionalChaining',
    fix: createLogicalExpressionFix(node, replacement),
  });
}

/**
 * Creates a text-replacement fixer for a logical expression.
 *
 * @param node - Logical expression node to replace.
 * @param replacement - Replacement text.
 * @returns ESLint fix callback.
 */
function createLogicalExpressionFix(
  node: TSESTree.LogicalExpression,
  replacement: string,
): TSESLint.ReportFixFunction {
  return fixLogicalExpression.bind(undefined, node, replacement);
}

/**
 * Creates listeners for require-optional-chaining rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireOptionalChainingListeners(
  context: RequireOptionalChainingContext,
): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;
  return {
    LogicalExpression: checkLogicalExpression.bind(undefined, context, sourceCode),
  };
}

/**
 * Applies the autofix to replace a logical expression with optional chaining.
 *
 * @param node - Logical expression node to replace.
 * @param replacement - Replacement text.
 * @param fixer - ESLint fixer.
 * @returns The generated fix.
 */
function fixLogicalExpression(
  node: TSESTree.LogicalExpression,
  replacement: string,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  return fixer.replaceText(node, replacement);
}

/**
 * Returns fixer text for logical guard patterns that can use optional chaining.
 *
 * @param node - Logical expression to analyze.
 * @param sourceCode - ESLint source code object.
 * @returns Replacement code, or null when no rewrite is applicable.
 */
function getOptionalChainReplacement(
  node: TSESTree.LogicalExpression,
  sourceCode: Readonly<TSESLint.SourceCode>,
): string | null {
  if (node.operator !== LOGICAL_AND_OPERATOR) {
    return null;
  }
  const left = unwrapExpression(node.left);
  if (!isSafeGuardExpression(left)) {
    return null;
  }
  return buildOptionalChainReplacement(sourceCode.getText(left), sourceCode.getText(node.right));
}

/**
 * Returns inner expression for supported wrapper node types.
 *
 * @param expression - The expression to inspect.
 * @returns The wrapped inner expression or null when not wrapped.
 */
function getWrappedExpression(expression: TSESTree.Expression): TSESTree.Expression | null {
  if (expression.type === AST_NODE_TYPES.ChainExpression) {
    return expression.expression;
  }
  if (expression.type === AST_NODE_TYPES.TSAsExpression) {
    return expression.expression;
  }
  return null;
}

/**
 * Returns true when a computed property key is side-effect-free.
 *
 * @param property - The computed property expression or private identifier.
 * @returns True when the key is safe to use in an auto-fix.
 */
function isSafeComputedKey(property: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  if (property.type === AST_NODE_TYPES.Identifier) {
    return true;
  }
  if (property.type === AST_NODE_TYPES.Literal) {
    return typeof property.value === 'string' || typeof property.value === 'number';
  }
  return false;
}

/**
 * Returns true when expression kind is safe as an optional-chaining guard.
 *
 * @param expression - The guard expression to validate.
 * @returns True when the expression is a safe guard candidate.
 */
function isSafeGuardExpression(expression: TSESTree.Expression): boolean {
  const node = unwrapExpression(expression);
  if (SIMPLE_GUARD_NODE_TYPES.has(node.type)) {
    return true;
  }
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return isSafeMemberExpression(node);
  }
  return false;
}

/**
 * Returns true when a MemberExpression is safe as a guard.
 *
 * @param node - The MemberExpression node.
 * @returns True when safe.
 */
function isSafeMemberExpression(node: TSESTree.MemberExpression): boolean {
  if (node.computed && !isSafeComputedKey(node.property)) {
    return false;
  }
  return isSafeGuardExpression(node.object);
}

/**
 * Applies the autofix to replace a logical expression with optional chaining.
 *
 * @param node - Logical expression node to replace.
 * @param replacement - Replacement text.
 * @param fixer - ESLint fixer.
 * @returns The generated fix.
 */
/**
 * Returns the unwrapped expression for chain wrappers.
 *
 * @param expression - The expression to unwrap.
 * @returns The inner expression when wrapped; otherwise the original node.
 */
function unwrapExpression(expression: TSESTree.Expression): TSESTree.Expression {
  const wrappedExpression = getWrappedExpression(expression);
  if (wrappedExpression === null) {
    return expression;
  }
  return unwrapExpression(wrappedExpression);
}

/**
 * ESLint rule that requires optional chaining for guard-access patterns.
 */
export const requireOptionalChaining = createRule({
  name: 'require-optional-chaining',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Require optional chaining instead of repeated logical guard access',
    },
    messages: {
      useOptionalChaining: 'Use optional chaining instead of repeating the same guard expression',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireOptionalChainingListeners,
});

export default requireOptionalChaining;
