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
import { isIdentifierNode, isMemberExpressionNode } from '../ast-guards';
import {
  TEST_DESCRIPTION_PREFIX,
  TEST_FUNCTION_IT,
  TEST_FUNCTION_TEST,
  TEST_METHOD_SKIP,
} from '../rule-constants';
import { createRule } from '../rule-factory';
import { isBoolean, isString } from '../type-guards';

type RuleOption = Readonly<{
  ignoreSkip?: boolean;
  prefix?: string;
}>;

type ResolvedRuleOptions = Readonly<{
  ignoreSkip: boolean;
  prefix: string;
}>;

type RequireTestDescriptionStyleContext = Readonly<
  TSESLint.RuleContext<'requireTestDescriptionStyle', []>
>;

/**
 * Returns a validated rule option object from unknown input.
 *
 * @param value - Unknown option input.
 * @returns Parsed rule option or null when invalid.
 */
function asRuleOption(value: unknown): RuleOption | null {
  if (!isRuleOptionRecord(value)) {
    return null;
  }
  return value;
}

/**
 * Checks a call expression and reports invalid test descriptions.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Call expression node to inspect.
 */
function checkCallExpression(
  context: RequireTestDescriptionStyleContext,
  options: ResolvedRuleOptions,
  node: TSESTree.CallExpression,
): void {
  const invalidDescription = getInvalidDescriptionForEnforcedTest(node, options);
  if (invalidDescription === null) {
    return;
  }
  context.report({
    node: invalidDescription,
    messageId: 'requireTestDescriptionStyle',
  });
}

/**
 * Creates listeners for require-test-description-style rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireTestDescriptionStyleListeners(
  context: RequireTestDescriptionStyleContext,
): TSESLint.RuleListener {
  const options = resolveOptions(context.options);
  return {
    CallExpression: checkCallExpression.bind(undefined, context, options),
  };
}

/**
 * Returns first argument as string literal when present and valid.
 *
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
 * Returns normalized `ignoreSkip` option value.
 *
 * @param option - Parsed rule option.
 * @returns Configured ignore-skip value or default.
 */
function getIgnoreSkipOption(option: RuleOption | null): boolean {
  if (option === null || option.ignoreSkip === undefined) {
    return true;
  }
  return option.ignoreSkip;
}

/**
 * Returns invalid test description literal, or null when valid/non-applicable.
 *
 * @param node - The call expression node to analyze.
 * @param prefix - Required test description prefix.
 * @returns The invalid description literal if found, null otherwise.
 */
function getInvalidDescription(
  node: TSESTree.CallExpression,
  prefix: string,
): TSESTree.Literal | null {
  const description = getDescriptionArgument(node);
  if (description === null || hasRequiredDescriptionPrefix(description, prefix)) {
    return null;
  }
  return description;
}

/**
 * Returns invalid description literal for enforced test calls, or null.
 *
 * @param node - The call expression node to check.
 * @param options - Resolved rule options.
 * @returns The invalid description literal if found, null otherwise.
 */
function getInvalidDescriptionForEnforcedTest(
  node: TSESTree.CallExpression,
  options: ResolvedRuleOptions,
): TSESTree.Literal | null {
  if (!isEnforcedTestCall(node)) {
    return null;
  }
  if (options.ignoreSkip && isSkippedTestCall(node)) {
    return null;
  }
  return getInvalidDescription(node, options.prefix);
}

/**
 * Returns normalized `prefix` option value.
 *
 * @param option - Parsed rule option.
 * @returns Configured prefix value or default.
 */
function getPrefixOption(option: RuleOption | null): string {
  if (option === null || option.prefix === undefined) {
    return TEST_DESCRIPTION_PREFIX;
  }
  return option.prefix;
}

/**
 * Returns argument node when it is a string literal.
 *
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
 * Returns true when test description conforms to expected prefix.
 *
 * @param node - The literal node containing the test description.
 * @param prefix - Required test description prefix.
 * @returns True if the description has the required prefix, false otherwise.
 */
function hasRequiredDescriptionPrefix(node: TSESTree.Literal, prefix: string): boolean {
  return String(node.value).trim().startsWith(prefix);
}

/**
 * Returns true for direct `it()`/`test()` calls.
 *
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
 * Returns true when call should be checked by this rule.
 *
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
 * Returns true for member calls like `it.only()` and `test.skip()`.
 *
 * @param node - The call expression node to check.
 * @returns True if the call is a member test call, false otherwise.
 */
function isMemberTestCall(node: TSESTree.CallExpression): boolean {
  if (!isMemberExpressionNode(node.callee) || !isIdentifierNode(node.callee.object)) {
    return false;
  }
  return isTestIdentifierName(node.callee.object.name);
}

/**
 * Returns true when value is a non-array object.
 *
 * @param value - Unknown value.
 * @returns True when value is object-like and not an array.
 */
function isNonArrayObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns true when `ignoreSkip` option value is valid.
 *
 * @param value - Option object value.
 * @returns True when `ignoreSkip` is boolean or undefined.
 */
function isRuleOptionIgnoreSkipValue(value: object): boolean {
  const ignoreSkip = Reflect.get(value, 'ignoreSkip');
  return ignoreSkip === undefined || isBoolean(ignoreSkip);
}

/**
 * Returns true when `prefix` option value is valid.
 *
 * @param value - Option object value.
 * @returns True when `prefix` is string or undefined.
 */
function isRuleOptionPrefixValue(value: object): boolean {
  const prefix = Reflect.get(value, 'prefix');
  return prefix === undefined || isString(prefix);
}

/**
 * Returns true when a value is a rule-option shaped object.
 *
 * @param value - Unknown option input.
 * @returns True when input can be treated as a rule option object.
 */
function isRuleOptionRecord(value: unknown): value is RuleOption {
  if (!isNonArrayObject(value)) {
    return false;
  }
  if (!isRuleOptionIgnoreSkipValue(value)) {
    return false;
  }
  return isRuleOptionPrefixValue(value);
}

/**
 * Returns true for skipped test calls like `it.skip()` and `test['skip']()`.
 *
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
 * Returns true when the property represents 'skip'.
 *
 * @param property - The property node to check.
 * @returns True if the property is 'skip'.
 */
function isSkipProperty(property: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  if (isIdentifierNode(property)) {
    return property.name === TEST_METHOD_SKIP;
  }
  return property.type === AST_NODE_TYPES.Literal && property.value === TEST_METHOD_SKIP;
}

/**
 * Returns true for `it` or `test` identifiers.
 *
 * @param name - The identifier name to check.
 * @returns True if the name is a test identifier, false otherwise.
 */
function isTestIdentifierName(name: string): boolean {
  return name === TEST_FUNCTION_IT || name === TEST_FUNCTION_TEST;
}

/**
 * Returns rule options with defaults applied.
 *
 * @param options - Raw ESLint rule options.
 * @returns Normalized options.
 */
function resolveOptions(options: ReadonlyArray<unknown>): ResolvedRuleOptions {
  const option = asRuleOption(options[0]);
  return {
    ignoreSkip: getIgnoreSkipOption(option),
    prefix: getPrefixOption(option),
  };
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
    schema: [
      {
        type: 'object',
        properties: {
          ignoreSkip: { type: 'boolean' },
          prefix: { type: 'string', minLength: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createRequireTestDescriptionStyleListeners,
});

export default requireTestDescriptionStyle;
