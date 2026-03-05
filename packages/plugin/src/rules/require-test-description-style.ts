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

import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { isIdentifierNode, isMemberExpressionNode } from '../ast-guards';
import { RULE_CREATOR_URL } from '../constants';
import {
  TEST_DESCRIPTION_PREFIX,
  TEST_FUNCTION_IT,
  TEST_FUNCTION_TEST,
  TEST_METHOD_SKIP,
} from '../rule-constants';
import { isString } from '../type-guards';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * Returns true for `it` or `test` identifiers.
 * @param name - The identifier name to check.
 * @returns True if the name is a test identifier, false otherwise.
 */
function isTestIdentifierName(name: string): boolean {
  return name === TEST_FUNCTION_IT || name === TEST_FUNCTION_TEST;
}

/**
 * Returns true for direct `it()`/`test()` calls.
 * @param node - The call expression node to check.
 * @returns True if the call is a direct test call, false otherwise.
 */
function isDirectTestCall(node: TSESTree.CallExpression): boolean {
  if (!isIdentifierNode(node.callee)) {
    return false;
  }
  return isTestIdentifierName(node.callee.name);
}

/**
 * Returns true for member calls like `it.only()` and `test.skip()`.
 * @param node - The call expression node to check.
 * @returns True if the call is a member test call, false otherwise.
 */
function isMemberTestCall(node: TSESTree.CallExpression): boolean {
  if (!isMemberExpressionNode(node.callee)) {
    return false;
  }
  if (!isIdentifierNode(node.callee.object)) {
    return false;
  }
  return isTestIdentifierName(node.callee.object.name);
}

/**
 * Returns true when callee is a member expression and narrows the node shape.
 *
 * @param node - The call expression node to check.
 * @returns True when node.callee is a member expression.
 */
function hasMemberExpressionCallee(
  node: TSESTree.CallExpression,
): node is TSESTree.CallExpression & { callee: TSESTree.MemberExpression } {
  return isMemberExpressionNode(node.callee);
}

/**
 * Returns true when the property represents 'skip'.
 * @param property - The property node to check.
 * @returns True if the property is 'skip'.
 */
function isSkipProperty(property: TSESTree.Expression): boolean {
  if (isIdentifierNode(property)) {
    return property.name === TEST_METHOD_SKIP;
  }
  return property.type === AST_NODE_TYPES.Literal && property.value === TEST_METHOD_SKIP;
}

/**
 * Returns true for skipped test calls like `it.skip()`, `test.skip()`,
 * `it['skip']()`, and `test['skip']()`.
 * @param node - The call expression node to check.
 * @returns True if the call is a skipped test call, false otherwise.
 */
function isSkippedTestCall(node: TSESTree.CallExpression): boolean {
  if (!isMemberTestCall(node) || !hasMemberExpressionCallee(node)) {
    return false;
  }
  return isSkipProperty(node.callee.property);
}

/**
 * Returns first argument as string literal when present and valid.
 * @param node - The call expression node to analyze.
 * @returns The string literal argument if present and valid, null otherwise.
 */
function getDescriptionArgument(node: TSESTree.CallExpression): TSESTree.Literal | null {
  if (node.arguments.length === 0) {
    return null;
  }
  return getStringLiteralArgument(node.arguments[0]);
}

/**
 * Returns true when test description conforms to expected prefix.
 * @param node - The literal node containing the test description.
 * @returns True if the description has the required prefix, false otherwise.
 */
function hasRequiredDescriptionPrefix(node: TSESTree.Literal): boolean {
  return String(node.value).trim().startsWith(TEST_DESCRIPTION_PREFIX);
}

/**
 * Returns true when call should be checked by this rule.
 * @param node - The call expression node to check.
 * @returns True if the call should be enforced, false otherwise.
 */
function isEnforcedTestCall(node: TSESTree.CallExpression): boolean {
  if (isDirectTestCall(node)) {
    return true;
  }
  return isMemberTestCall(node);
}

/**
 * Returns invalid test description literal, or null when valid/non-applicable.
 * @param node - The call expression node to analyze.
 * @returns The invalid description literal if found, null otherwise.
 */
function getInvalidDescription(node: TSESTree.CallExpression): TSESTree.Literal | null {
  const description = getDescriptionArgument(node);
  if (description === null) {
    return null;
  }
  if (hasRequiredDescriptionPrefix(description)) {
    return null;
  }
  return description;
}

/**
 * Returns argument node when it is a string literal.
 * @param arg - The argument node to check.
 * @returns The literal node if it's a string literal, null otherwise.
 */
function getStringLiteralArgument(arg: TSESTree.CallExpressionArgument): TSESTree.Literal | null {
  if (arg.type !== AST_NODE_TYPES.Literal || !isString(arg.value)) {
    return null;
  }
  return arg;
}

/**
 * Returns invalid description literal for enforced test calls, or null.
 * @param node - The call expression node to check.
 * @returns The invalid description literal if found, null otherwise.
 */
function getInvalidDescriptionForEnforcedTest(
  node: TSESTree.CallExpression,
): TSESTree.Literal | null {
  if (isSkippedTestCall(node) || !isEnforcedTestCall(node)) {
    return null;
  }
  return getInvalidDescription(node);
}

/**
 * ESLint rule that enforces test description style requirements.
 */
export const requireTestDescriptionStyle = createRule({
  name: 'require-test-description-style',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that test descriptions start with "should"',
    },
    messages: {
      requireTestDescriptionStyle: 'Test description should start with "should"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const checkCallExpression = (node: TSESTree.CallExpression): void => {
      const invalidDescription = getInvalidDescriptionForEnforcedTest(node);
      if (invalidDescription === null) {
        return;
      }
      context.report({
        node: invalidDescription,
        messageId: 'requireTestDescriptionStyle',
      });
    };

    return {
      CallExpression: checkCallExpression,
    };
  },
});

export default requireTestDescriptionStyle;
