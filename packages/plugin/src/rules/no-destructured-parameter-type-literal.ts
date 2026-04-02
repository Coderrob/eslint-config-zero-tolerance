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
import { type FunctionNode } from '../helpers/ast-guards';
import { getObjectDestructuredParameterTypeNode } from '../helpers/ast/parameters';
import { someDescendant } from '../helpers/ast/search';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

type NoDestructuredParameterTypeLiteralContext = Readonly<
  TSESLint.RuleContext<'noDestructuredParameterTypeLiteral', []>
>;

/**
 * Checks one function-like node for destructured parameters that declare inline object types.
 *
 * @param context - ESLint rule execution context.
 * @param node - Function-like node.
 */
function checkFunctionNode(
  context: NoDestructuredParameterTypeLiteralContext,
  node: FunctionNode,
): void {
  for (const param of node.params) {
    reportIfInlineDestructuredParameterType(context, param);
  }
}

/**
 * Creates listeners for destructured-parameter inline type checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoDestructuredParameterTypeLiteralListeners(
  context: NoDestructuredParameterTypeLiteralContext,
): TSESLint.RuleListener {
  return createFunctionNodeListeners(checkFunctionNode.bind(undefined, context));
}

/**
 * Returns true when the provided type tree contains an inline object type literal.
 *
 * @param node - Root type node.
 * @param sourceCode - ESLint source code helper.
 * @returns True when a TSTypeLiteral exists in the type tree.
 */
function hasInlineObjectTypeLiteral(
  node: TSESTree.TypeNode,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  return someDescendant(node, sourceCode, isTypeLiteralNode);
}

/**
 * Returns true when a node is a TypeScript type literal.
 *
 * @param node - Node to inspect.
 * @returns True when the node is a TSTypeLiteral.
 */
function isTypeLiteralNode(node: TSESTree.Node): node is TSESTree.TSTypeLiteral {
  return node.type === AST_NODE_TYPES.TSTypeLiteral;
}

/**
 * Reports object-destructured parameters that declare inline object type literals.
 *
 * @param context - ESLint rule execution context.
 * @param param - Function parameter node.
 */
function reportIfInlineDestructuredParameterType(
  context: NoDestructuredParameterTypeLiteralContext,
  param: TSESTree.Parameter,
): void {
  const typeNode = getObjectDestructuredParameterTypeNode(param);
  if (typeNode === null || !hasInlineObjectTypeLiteral(typeNode, context.sourceCode)) {
    return;
  }
  context.report({
    node: param,
    messageId: 'noDestructuredParameterTypeLiteral',
  });
}

/**
 * ESLint rule that disallows inline object type literals on destructured parameters.
 */
export const noDestructuredParameterTypeLiteral = createRule({
  name: 'no-destructured-parameter-type-literal',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow inline object type literals on destructured parameters; require a named type instead',
    },
    messages: {
      noDestructuredParameterTypeLiteral:
        'Destructured parameters must reference a named type instead of declaring an inline object type literal.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoDestructuredParameterTypeLiteralListeners,
});

export default noDestructuredParameterTypeLiteral;
