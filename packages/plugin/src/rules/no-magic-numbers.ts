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
  isTSEnumMemberNode,
  isUnaryExpressionNode,
  isVariableDeclaratorNode,
} from '../helpers/ast-guards';
import { isNumber } from '../helpers/type-guards';
import { OPERATOR_UNARY_MINUS, VARIABLE_KIND_CONST } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type NoMagicNumbersContext = Readonly<TSESLint.RuleContext<'noMagicNumbers', []>>;

/**
 * Checks one literal node and reports disallowed numeric values.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code helper.
 * @param node - Literal node to inspect.
 */
function checkLiteral(
  context: NoMagicNumbersContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Literal,
): void {
  if (!isNumber(node.value)) {
    return;
  }
  if (isAllowedNumericLiteral(node)) {
    return;
  }
  const rawValue = getNumericLiteralText(node, sourceCode);
  context.report({
    node,
    messageId: 'noMagicNumbers',
    data: { value: rawValue },
  });
}

/**
 * Creates listeners for magic-number checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoMagicNumbersListeners(context: NoMagicNumbersContext): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;
  return {
    Literal: checkLiteral.bind(undefined, context, sourceCode),
  };
}

/**
 * Returns variable declarator directly owning the node, when present.
 *
 * @param node - Candidate node whose parent may be a variable declarator.
 * @returns Owning variable declarator, or null.
 */
function getDirectVariableDeclarator(node: TSESTree.Node): TSESTree.VariableDeclarator | null {
  if (!isVariableDeclaratorNode(node.parent)) {
    return null;
  }
  return node.parent;
}

/**
 * Returns normalized raw text for numeric literal reporting.
 *
 * @param node - Numeric literal node.
 * @param sourceCode - Source code helper.
 * @returns Raw literal text.
 */
function getNumericLiteralText(
  node: TSESTree.Literal,
  sourceCode: Readonly<TSESLint.SourceCode>,
): string {
  if (isUnaryMinus(node.parent)) {
    return sourceCode.getText(node.parent);
  }
  return sourceCode.getText(node);
}

/**
 * Returns the owning variable declarator for a literal or unary-minus wrapper.
 *
 * @param node - The literal node to find the declarator for.
 * @returns The variable declarator if found, otherwise null.
 */
function getVariableDeclarator(node: TSESTree.Literal): TSESTree.VariableDeclarator | null {
  if (isUnaryMinus(node.parent)) {
    return getDirectVariableDeclarator(node.parent);
  }
  return getDirectVariableDeclarator(node);
}

/**
 * Returns true when a numeric literal is exempt from magic-number reporting.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is allowed, false otherwise.
 */
function isAllowedNumericLiteral(node: TSESTree.Literal): boolean {
  if (isAllowedValue(node)) {
    return true;
  }
  if (isInConstDeclaration(node)) {
    return true;
  }
  return isInEnumMember(node);
}

/**
 * Returns true when a numeric literal has one of the universally-understood
 * values that do not require a named constant: 0, 1, or -1.
 *
 * @param node - The literal node to check.
 * @returns True if the value is allowed, false otherwise.
 */
function isAllowedValue(node: TSESTree.Literal): boolean {
  if (node.value === 0) {
    return true;
  }
  if (isNegativeOneLiteral(node)) {
    return true;
  }
  return node.value === 1;
}

/**
 * Returns true when declaration node is a const variable declaration.
 *
 * @param node - Variable declaration node.
 * @returns True when declaration uses const.
 */
function isConstVariableDeclaration(node: TSESTree.VariableDeclaration): boolean {
  return node.kind === VARIABLE_KIND_CONST;
}

/**
 * Returns true when the numeric literal is the direct initializer of a
 * `const` variable declaration, making it a named constant.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in a const declaration, false otherwise.
 */
function isInConstDeclaration(node: TSESTree.Literal): boolean {
  const variableDeclarator = getVariableDeclarator(node);
  if (variableDeclarator === null) {
    return false;
  }
  return isConstVariableDeclaration(variableDeclarator.parent);
}

/**
 * Returns true when the numeric literal is the initializer of a TypeScript
 * enum member, which gives it an implicit name.
 *
 * @param node - The literal node to check.
 * @returns True if the literal is in an enum member, false otherwise.
 */
function isInEnumMember(node: TSESTree.Literal): boolean {
  return isTSEnumMemberNode(node.parent);
}

/**
 * Returns true when a literal is represented as `-1` in the AST.
 *
 * @param node - The literal node to check.
 * @returns True if the literal represents -1, false otherwise.
 */
function isNegativeOneLiteral(node: TSESTree.Literal): boolean {
  if (node.value !== 1) {
    return false;
  }
  return isUnaryMinus(node.parent);
}

/**
 * Returns true for unary '-' expression nodes.
 *
 * @param node - The node to check.
 * @returns True if the node is a unary minus expression, false otherwise.
 */
function isUnaryMinus(node: TSESTree.Node | undefined): node is TSESTree.UnaryExpression {
  if (!isUnaryExpressionNode(node)) {
    return false;
  }
  return node.operator === OPERATOR_UNARY_MINUS;
}

/**
 * ESLint rule that disallows magic numbers; use named constants instead of raw numeric literals.
 */
export const noMagicNumbers = createRule({
  name: 'no-magic-numbers',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow magic numbers; use named constants instead of raw numeric literals',
    },
    messages: {
      noMagicNumbers: 'Magic number {{value}} is not allowed; extract it into a named constant',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoMagicNumbersListeners,
});

export default noMagicNumbers;
