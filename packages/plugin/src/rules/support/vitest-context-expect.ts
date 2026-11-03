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
import { getBinding, isNamedImport } from './test-imports';

const EXPECT_NAME = 'expect';
const PARAMETER_DEFINITION_TYPE = 'Parameter';
const VITEST_MODULE = 'vitest';
const VITEST_TEST_NAMES = new Set(['test', 'it']);

type AssertionContext = Readonly<TSESLint.RuleContext<string, readonly unknown[]>>;

/**
 * Checks the first callback parameter for a destructured expect property.
 *
 * @param node - Vitest test callback.
 * @param bindingName - Local identifier receiving expect.
 * @returns Whether the callback supplies this expect binding.
 */
function hasVitestExpectParameter(
  node: Readonly<TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression>,
  bindingName: Readonly<TSESTree.Identifier>,
): boolean {
  if (node.params.length === 0) {
    return false;
  }
  const parameter = node.params[0];
  return (
    parameter.type === AST_NODE_TYPES.ObjectPattern &&
    parameter.properties.some((property) => isExpectPatternProperty(property, bindingName))
  );
}

/**
 * Checks a destructured property that selects the expect test-context value.
 *
 * @param property - Object-pattern property.
 * @param bindingName - Identifier receiving the property.
 * @returns Whether the property defines this expect binding.
 */
function isExpectPatternProperty(
  property: Readonly<TSESTree.Property | TSESTree.RestElement>,
  bindingName: Readonly<TSESTree.Identifier>,
): boolean {
  if (property.type !== AST_NODE_TYPES.Property || property.value !== bindingName) {
    return false;
  }
  return isExpectPropertyKey(property.key);
}

/**
 * Checks the key used to select expect from a test context.
 *
 * @param key - Object-pattern property key.
 * @returns Whether the property is named expect.
 */
function isExpectPropertyKey(key: Readonly<TSESTree.Expression>): boolean {
  if (key.type === AST_NODE_TYPES.Identifier) {
    return key.name === EXPECT_NAME;
  }
  return key.type === AST_NODE_TYPES.Literal && key.value === EXPECT_NAME;
}

/**
 * Checks a callback function node.
 *
 * @param node - Candidate function.
 * @returns Whether the node can be a test callback.
 */
function isFunctionExpression(
  node: Readonly<TSESTree.Node>,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression
  );
}

/**
 * Checks whether a test identifier has no local binding.
 *
 * @param context - Rule execution context.
 * @param node - Candidate test identifier.
 * @returns Whether the identifier is unbound or supplied as a global.
 */
function isUnbound(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  const binding = getBinding(context, node);
  return binding === null || binding.defs.length === 0;
}

/**
 * Checks a destructured Vitest test-context expect binding.
 *
 * @param context - Rule execution context.
 * @param node - Candidate expect identifier.
 * @returns Whether the identifier came from a Vitest test callback.
 */
export function isVitestContextExpect(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  const binding = getBinding(context, node);
  return binding?.defs.some((definition) => isVitestContextParameter(context, definition)) ?? false;
}

/**
 * Checks a Vitest test callback containing a destructured expect parameter.
 *
 * @param context - Rule execution context.
 * @param definition - Parameter binding definition.
 * @returns Whether Vitest supplies the parameter.
 */
function isVitestContextParameter(
  context: Readonly<AssertionContext>,
  definition: Readonly<TSESLint.Scope.Definition>,
): boolean {
  if (!isVitestExpectParameter(definition)) {
    return false;
  }
  const parent = definition.node.parent;
  return parent.type === AST_NODE_TYPES.CallExpression && isVitestTestCall(context, parent);
}

/**
 * Checks the destructured expect property in a callback parameter.
 *
 * @param definition - Parameter binding definition.
 * @returns Whether the first parameter provides expect.
 */
function isVitestExpectParameter(definition: Readonly<TSESLint.Scope.Definition>): boolean {
  const bindingName = definition.name;
  if (
    definition.type !== PARAMETER_DEFINITION_TYPE ||
    bindingName.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }
  return (
    isFunctionExpression(definition.node) && hasVitestExpectParameter(definition.node, bindingName)
  );
}

/**
 * Checks a direct Vitest test call.
 *
 * @param context - Rule execution context.
 * @param node - Candidate test call.
 * @returns Whether the call invokes Vitest test or it.
 */
function isVitestTestCall(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier && isVitestTestIdentifier(context, node.callee)
  );
}

/**
 * Checks an imported or unshadowed Vitest test binding.
 *
 * @param context - Rule execution context.
 * @param node - Candidate test identifier.
 * @returns Whether the identifier can create a Vitest test.
 */
function isVitestTestIdentifier(
  context: Readonly<AssertionContext>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (
    isNamedImport(context, node, VITEST_MODULE, 'test') ||
    isNamedImport(context, node, VITEST_MODULE, 'it') ||
    (VITEST_TEST_NAMES.has(node.name) && isUnbound(context, node))
  );
}
