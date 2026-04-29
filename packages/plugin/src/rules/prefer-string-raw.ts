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
import {
  isCallExpressionNode,
  isNamedIdentifierNode,
  isUncomputedMemberExpressionNode,
} from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

const BACKSLASH_CODE_POINT = 92;
const BACKSLASH = String.fromCodePoint(BACKSLASH_CODE_POINT);
const STRING_RAW_PROPERTY_NAME = 'raw';
const STRING_CONSTRUCTOR_NAME = 'String';
const TEMPLATE_BACKTICK = '`';
const TEMPLATE_INTERPOLATION_START = '${';
const STRING_RAW_TAG_PREFIX = 'String.raw';

type PreferStringRawContext = Readonly<TSESLint.RuleContext<'preferStringRaw', []>>;

/**
 * Returns replacement text for a `String.raw` tagged template, or null when unsafe.
 *
 * @param node - String literal node to transform.
 * @returns Tagged-template replacement text, or null when autofix is not safe.
 */
function buildStringRawReplacement(node: Readonly<TSESTree.StringLiteral>): string | null {
  if (node.value.includes(TEMPLATE_BACKTICK) || node.value.includes(TEMPLATE_INTERPOLATION_START)) {
    return null;
  }
  return `${STRING_RAW_TAG_PREFIX}\`${node.value}\``;
}

/**
 * Checks one string literal and reports when escaped backslashes should use String.raw.
 *
 * @param context - ESLint rule execution context.
 * @param node - Literal node to inspect.
 */
function checkStringLiteral(context: Readonly<PreferStringRawContext>, node: Readonly<TSESTree.Literal>): void {
  if (!isStringLiteral(node)) {
    return;
  }
  if (!containsBackslash(node.value)) {
    return;
  }
  if (isInsideStringRaw(node)) {
    return;
  }
  reportPreferStringRaw(context, node);
}

/**
 * Returns true when a value contains one or more backslash characters.
 *
 * @param value - String literal value.
 * @returns True when value contains backslashes.
 */
function containsBackslash(value: string): boolean {
  return value.includes(BACKSLASH);
}

/**
 * Creates a fixer for literals that should be represented by String.raw.
 *
 * @param node - String literal node to transform.
 * @param fixer - ESLint fixer helper.
 * @returns Rule fix to replace literal with String.raw template, or null when unsafe.
 */
function createPreferStringRawFix(
  node: Readonly<TSESTree.StringLiteral>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix | null {
  const replacement = buildStringRawReplacement(node);
  if (replacement === null) {
    return null;
  }
  return fixer.replaceText(node, replacement);
}

/**
 * Creates listeners for prefer-string-raw rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createPreferStringRawListeners(context: Readonly<PreferStringRawContext>): TSESLint.RuleListener {
  return {
    Literal: checkStringLiteral.bind(undefined, context),
  };
}

/**
 * Returns true when a node is a String.raw() call target argument.
 *
 * @param node - Literal node to inspect.
 * @returns True when node is passed directly to String.raw.
 */
function isInsideStringRaw(node: Readonly<TSESTree.Literal>): boolean {
  const parentNode = node.parent;
  if (!isCallExpressionNode(parentNode)) {
    return false;
  }
  if (!parentNode.arguments.includes(node)) {
    return false;
  }
  return isStringRawCallee(parentNode.callee);
}

/**
 * Returns true when expression is the canonical String constructor identifier.
 *
 * @param node - Member-expression object node.
 * @returns True when node is `String`.
 */
function isStringConstructorIdentifier(node: Readonly<TSESTree.Expression>): boolean {
  return isNamedIdentifierNode(node, STRING_CONSTRUCTOR_NAME);
}

/**
 * Returns true when a literal node is a string literal.
 *
 * @param node - Literal node to inspect.
 * @returns True when literal value is a string.
 */
function isStringLiteral(node: Readonly<TSESTree.Literal>): node is TSESTree.StringLiteral {
  return typeof node.value === 'string';
}

/**
 * Returns true when expression is the `raw` property identifier.
 *
 * @param node - Member-expression property node.
 * @returns True when property is `raw`.
 */
function isStringRawCallee(callee: Readonly<TSESTree.Expression>): boolean {
  if (!isUncomputedMemberExpressionNode(callee)) {
    return false;
  }
  return (
    isStringConstructorIdentifier(callee.object) && isStringRawPropertyIdentifier(callee.property)
  );
}

/**
 * Returns true when expression is the canonical String.raw member access.
 *
 * @param callee - Call expression callee.
 * @returns True when callee is String.raw.
 */
function isStringRawPropertyIdentifier(
  node: TSESTree.Expression | TSESTree.PrivateIdentifier,
): boolean {
  return isNamedIdentifierNode(node, STRING_RAW_PROPERTY_NAME);
}

/**
 * Reports one string literal that should be converted to String.raw.
 *
 * @param context - ESLint rule execution context.
 * @param node - String literal node to report.
 */
function reportPreferStringRaw(
  context: Readonly<PreferStringRawContext>,
  node: Readonly<TSESTree.StringLiteral>,
): void {
  context.report({
    node,
    messageId: 'preferStringRaw',
    fix: createPreferStringRawFix.bind(undefined, node),
  });
}

/**
 * ESLint rule that prefers String.raw for literals containing escaped backslashes.
 */
export const preferStringRaw = createRule({
  name: 'prefer-string-raw',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Prefer String.raw for string literals containing escaped backslashes (Sonar S7780)',
    },
    messages: {
      preferStringRaw: 'String.raw should be used to avoid escaping backslashes',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferStringRawListeners,
});

export default preferStringRaw;
