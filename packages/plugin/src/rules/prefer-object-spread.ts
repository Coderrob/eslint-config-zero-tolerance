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

const OBJECT_GLOBAL = 'Object';
const ASSIGN_METHOD = 'assign';

type PreferObjectSpreadContext = Readonly<TSESLint.RuleContext<'preferObjectSpread', []>>;

/**
 * Converts a single argument to its spread representation text.
 *
 * @param sourceCode - ESLint source code helper.
 * @param arg - Argument expression node.
 * @returns The spread text fragment for this argument.
 */
function argumentToSpreadText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  arg: Readonly<TSESTree.Expression>,
): string {
  if (arg.type === AST_NODE_TYPES.ObjectExpression) {
    return arg.properties
      .map(/** @param prop - Object property node. */ (prop) => sourceCode.getText(prop))
      .join(', ');
  }
  return `...${sourceCode.getText(arg)}`;
}

/**
 * Collects spread text parts from all arguments after skipping the leading empty object.
 *
 * @param sourceCode - ESLint source code helper.
 * @param args - Filtered expression arguments from Object.assign call.
 * @returns Array of spread text fragments.
 */
function collectSpreadParts(
  sourceCode: Readonly<TSESLint.SourceCode>,
  args: readonly TSESTree.Expression[],
): string[] {
  return args
    .slice(1)
    .filter(
      /** @param arg - Object.assign argument to evaluate. */
      (arg) => !isEmptyObjectLiteral(arg),
    )
    .map(
      /** @param arg - Object.assign argument to convert. */
      (arg) => argumentToSpreadText(sourceCode, arg),
    );
}

/**
 * Creates a fixer that rewrites Object.assign({}, ...args) to spread syntax.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - The Object.assign call expression.
 * @param fixer - ESLint fixer helper.
 * @returns Text replacement fix.
 */
function createObjectSpreadFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.CallExpression>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const spreadParts = collectSpreadParts(sourceCode, node.arguments.filter(isExpressionArgument));
  const inner = spreadParts.length > 0 ? ` ${spreadParts.join(', ')} ` : '';
  const objectLiteralText = `{${inner}}`;
  const replacementText = shouldParenthesizeObjectSpread(node)
    ? `(${objectLiteralText})`
    : objectLiteralText;
  return fixer.replaceText(node, replacementText);
}

/**
 * Creates listeners for the prefer-object-spread rule.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createPreferObjectSpreadListeners(
  context: Readonly<PreferObjectSpreadContext>,
): TSESLint.RuleListener {
  return {
    /** @param node - Call expression node to evaluate. */
    CallExpression(node: Readonly<TSESTree.CallExpression>): void {
      if (
        isObjectAssignCall(node) &&
        isEmptyObjectLiteral(node.arguments[0]) &&
        !hasSpreadArgument(node)
      ) {
        reportObjectAssign(context, node);
      }
    },
  };
}

/**
 * Returns true when any Object.assign argument uses spread syntax.
 *
 * @param node - Call expression to inspect.
 * @returns Whether the call has spread arguments.
 */
function hasSpreadArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  return node.arguments.some(
    /** @param arg - Argument node to inspect. */
    (arg) => arg.type === AST_NODE_TYPES.SpreadElement,
  );
}

/**
 * Returns true when the node is an identifier named `assign`.
 *
 * @param node - Property node to check.
 * @returns Whether the property is the assign identifier.
 */
function isAssignProperty(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === ASSIGN_METHOD;
}

/**
 * Returns true when the node is an empty object literal.
 *
 * @param node - AST node to inspect.
 * @returns Whether the node is an empty ObjectExpression.
 */
function isEmptyObjectLiteral(node: Readonly<TSESTree.Node>): boolean {
  return node.type === AST_NODE_TYPES.ObjectExpression && node.properties.length === 0;
}

/**
 * Returns true when the call argument is a regular (non-spread) expression.
 *
 * @param node - Call argument to inspect.
 * @returns Whether the argument is not a spread element.
 */
function isExpressionArgument(
  node: Readonly<TSESTree.CallExpressionArgument>,
): node is TSESTree.Expression {
  return node.type !== AST_NODE_TYPES.SpreadElement;
}

/**
 * Returns true when the call expression is Object.assign with at least one argument.
 *
 * @param node - Call expression to inspect.
 * @returns Whether the callee is Object.assign with arguments.
 */
function isObjectAssignCall(node: Readonly<TSESTree.CallExpression>): boolean {
  return node.arguments.length >= 1 && isObjectAssignMember(node.callee);
}

/**
 * Returns true when the callee is Object.assign as a non-computed member.
 *
 * @param callee - The callee expression from the call.
 * @returns Whether the callee matches Object.assign.
 */
function isObjectAssignMember(callee: Readonly<TSESTree.Expression>): boolean {
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) {
    return false;
  }
  return isObjectIdentifier(callee.object) && isAssignProperty(callee.property);
}

/**
 * Returns true when the node is the global Object identifier.
 *
 * @param node - AST node to inspect.
 * @returns Whether the node is Object.
 */
function isObjectIdentifier(node: Readonly<TSESTree.Expression>): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === OBJECT_GLOBAL;
}

/**
 * Reports an Object.assign call that can be replaced with object spread.
 *
 * @param context - ESLint rule execution context.
 * @param node - The Object.assign call expression.
 */
function reportObjectAssign(
  context: Readonly<PreferObjectSpreadContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  context.report({
    node,
    messageId: 'preferObjectSpread',
    fix: createObjectSpreadFix.bind(undefined, context.sourceCode, node),
  });
}

/**
 * Returns true when replacing the call with an object literal requires parentheses.
 *
 * @param node - Call expression being replaced.
 * @returns Whether the replacement must be parenthesized to remain valid syntax.
 */
function shouldParenthesizeObjectSpread(node: Readonly<TSESTree.CallExpression>): boolean {
  const { parent } = node;
  if (parent.type === AST_NODE_TYPES.ExpressionStatement) {
    return true;
  }
  if (parent.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
    return false;
  }
  return parent.body === node;
}

/**
 * ESLint rule that enforces object spread syntax over Object.assign.
 */
export const preferObjectSpread = createRule({
  name: 'prefer-object-spread',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Enforce object spread syntax instead of Object.assign with an empty object literal as the first argument',
    },
    messages: {
      preferObjectSpread:
        'Use an object spread instead of Object.assign, e.g. `{ ...foo }` instead of `Object.assign({}, foo)`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferObjectSpreadListeners,
});

export default preferObjectSpread;
