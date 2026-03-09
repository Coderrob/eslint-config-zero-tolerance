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
import { isBinaryExpressionNode, isSwitchCaseNode } from '../ast-guards';
import { createRule } from '../rule-factory';
import { isString } from '../type-guards';

const COMPARISON_OPERATORS = new Set(['===', '!==', '==', '!=']);
const TYPEOF_OPERATOR = 'typeof';

interface INoMagicStringsOptions {
  checkComparisons?: boolean;
  checkSwitchCases?: boolean;
  ignoreValues?: string[];
}

interface IResolvedNoMagicStringsOptions {
  checkComparisons: boolean;
  checkSwitchCases: boolean;
  ignoreValues: Set<string>;
}

type NoMagicStringsContext = Readonly<TSESLint.RuleContext<'noMagicStrings', RuleOptions>>;
type RuleOptions = [INoMagicStringsOptions];

/**
 * Checks one literal node for disallowed magic strings.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Literal node to inspect.
 */
function checkLiteral(
  context: NoMagicStringsContext,
  options: IResolvedNoMagicStringsOptions,
  node: TSESTree.Literal,
): void {
  const value = getStringValue(node);
  if (value === null || options.ignoreValues.has(value)) {
    return;
  }
  if (isMagicStringContext(node, options)) {
    context.report({
      node,
      messageId: 'noMagicStrings',
      data: { value },
    });
  }
}

/**
 * Creates listeners for magic-string checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoMagicStringsListeners(context: NoMagicStringsContext): TSESLint.RuleListener {
  const options = resolveOptions(context.options);
  return {
    Literal: checkLiteral.bind(undefined, context, options),
  };
}

/**
 * Returns normalized non-empty string literal value, or null when invalid.
 *
 * @param node - The literal node to extract the string value from.
 * @returns The string value if valid, otherwise null.
 */
function getStringValue(node: TSESTree.Literal): string | null {
  if (!isString(node.value) || node.value === '') {
    return null;
  }
  return node.value;
}

/**
 * Returns true when comparison-context checks are enabled and matched.
 *
 * @param node - Literal node to evaluate.
 * @param options - Resolved rule options.
 * @returns True when comparison context should report.
 */
function isComparableBinaryExpression(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.BinaryExpression {
  return isBinaryExpressionNode(node) && COMPARISON_OPERATORS.has(node.operator);
}

/**
 * Returns true when the string literal appears on either side of a
 * comparison expression.
 *
 * @param node - The literal node to check.
 * @param options - Resolved rule options.
 * @returns True if the literal is in a comparison expression, false otherwise.
 */
function isComparisonContextEnabled(
  node: TSESTree.Literal,
  options: IResolvedNoMagicStringsOptions,
): boolean {
  return options.checkComparisons && isInComparisonExpression(node);
}

/**
 * Returns true when the string literal is the test value of a switch-case.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in a switch case, false otherwise.
 */
function isInComparisonExpression(node: TSESTree.Literal): boolean {
  if (!isBinaryExpressionNode(node.parent)) {
    return false;
  }
  return COMPARISON_OPERATORS.has(node.parent.operator);
}

/**
 * Returns true when the literal is part of a `typeof` comparison.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in a typeof comparison, false otherwise.
 */
function isInSwitchCase(node: TSESTree.Literal): boolean {
  return isSwitchCaseNode(node.parent) && node.parent.test === node;
}

/**
 * Returns true when node is a binary comparison expression.
 *
 * @param node - Candidate parent node.
 * @returns True when node is a supported binary comparison.
 */
function isInTypeofComparison(node: TSESTree.Literal): boolean {
  const parentExpression = node.parent;
  if (!isComparableBinaryExpression(parentExpression)) {
    return false;
  }
  const oppositeExpression =
    parentExpression.left === node ? parentExpression.right : parentExpression.left;
  if (oppositeExpression.type === AST_NODE_TYPES.PrivateIdentifier) {
    return false;
  }
  return isTypeofUnaryExpression(oppositeExpression);
}

/**
 * Returns true when literal appears in a context where magic strings are forbidden.
 *
 * @param node - The literal node to check.
 * @param options - Resolved rule options.
 * @returns True if the literal is in a forbidden context, false otherwise.
 */
function isMagicStringContext(
  node: TSESTree.Literal,
  options: IResolvedNoMagicStringsOptions,
): boolean {
  if (isInTypeofComparison(node)) {
    return false;
  }
  if (isComparisonContextEnabled(node, options)) {
    return true;
  }
  return isSwitchCaseContextEnabled(node, options);
}

/**
 * Returns true when switch-case checks are enabled and matched.
 *
 * @param node - Literal node to evaluate.
 * @param options - Resolved rule options.
 * @returns True when switch-case context should report.
 */
function isSwitchCaseContextEnabled(
  node: TSESTree.Literal,
  options: IResolvedNoMagicStringsOptions,
): boolean {
  return options.checkSwitchCases && isInSwitchCase(node);
}

/**
 * Returns true when expression is a unary `typeof` expression.
 *
 * @param expression - Expression node.
 * @returns True when expression is `typeof ...`.
 */
function isTypeofUnaryExpression(expression: TSESTree.Expression): boolean {
  if (expression.type !== AST_NODE_TYPES.UnaryExpression) {
    return false;
  }
  return expression.operator === TYPEOF_OPERATOR;
}

/**
 * Resolves check-comparisons option with default.
 *
 * @param raw - Raw rule options object.
 * @returns Resolved boolean option.
 */
function resolveCheckComparisonsOption(raw: INoMagicStringsOptions | undefined): boolean {
  if (raw?.checkComparisons === undefined) {
    return true;
  }
  return raw.checkComparisons;
}

/**
 * Resolves check-switch-cases option with default.
 *
 * @param raw - Raw rule options object.
 * @returns Resolved boolean option.
 */
function resolveCheckSwitchCasesOption(raw: INoMagicStringsOptions | undefined): boolean {
  if (raw?.checkSwitchCases === undefined) {
    return true;
  }
  return raw.checkSwitchCases;
}

/**
 * Resolves ignore-values option with default.
 *
 * @param raw - Raw rule options object.
 * @returns Resolved ignored string-value set.
 */
function resolveIgnoreValuesOption(raw: INoMagicStringsOptions | undefined): Set<string> {
  return new Set(raw?.ignoreValues ?? []);
}

/**
 * Returns rule options with defaults applied.
 *
 * @param options - Raw rule options.
 * @returns Resolved rule options.
 */
function resolveOptions(options: RuleOptions): IResolvedNoMagicStringsOptions {
  const raw = options[0];
  return {
    checkComparisons: resolveCheckComparisonsOption(raw),
    checkSwitchCases: resolveCheckSwitchCasesOption(raw),
    ignoreValues: resolveIgnoreValuesOption(raw),
  };
}

/**
 * ESLint rule that disallows magic strings; use named constants instead of raw string literals.
 */
export const noMagicStrings = createRule({
  name: 'no-magic-strings',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow magic strings in comparisons and switch cases; use named constants instead',
    },
    messages: {
      noMagicStrings: 'Magic string "{{value}}" is not allowed; extract it into a named constant',
    },
    schema: [
      {
        type: 'object',
        properties: {
          checkComparisons: { type: 'boolean' },
          checkSwitchCases: { type: 'boolean' },
          ignoreValues: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create: createNoMagicStringsListeners,
});

export default noMagicStrings;
