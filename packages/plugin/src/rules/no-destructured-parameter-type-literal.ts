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
import type { FunctionNode } from '../ast-guards';
import { createRule } from '../rule-factory';

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
  return {
    ArrowFunctionExpression: checkFunctionNode.bind(undefined, context),
    FunctionDeclaration: checkFunctionNode.bind(undefined, context),
    FunctionExpression: checkFunctionNode.bind(undefined, context),
  };
}

/**
 * Returns the type node for an assignment-pattern object-destructured parameter shape.
 *
 * @param param - Assignment-pattern parameter.
 * @returns Type node when the left side destructures an object and is annotated.
 */
function getAssignmentPatternObjectDestructuredTypeNode(
  param: TSESTree.AssignmentPattern,
): TSESTree.TypeNode | null {
  if (param.left.type !== AST_NODE_TYPES.ObjectPattern) {
    return null;
  }
  return param.left.typeAnnotation?.typeAnnotation ?? null;
}

/**
 * Returns the type node for a directly object-destructured parameter shape.
 *
 * @param param - Function parameter node.
 * @returns Type node when the parameter is an object pattern and is annotated.
 */
function getDirectObjectDestructuredTypeNode(param: TSESTree.Parameter): TSESTree.TypeNode | null {
  if (param.type !== AST_NODE_TYPES.ObjectPattern) {
    return null;
  }
  return param.typeAnnotation?.typeAnnotation ?? null;
}

/**
 * Returns the type node for an object-destructured parameter shape.
 *
 * @param param - Function parameter node.
 * @returns Type node when the parameter destructures an object and is annotated.
 */
function getObjectDestructuredParameterTypeNode(
  param: TSESTree.Parameter,
): TSESTree.TypeNode | null {
  const directTypeNode = getDirectObjectDestructuredTypeNode(param);
  if (directTypeNode !== null) {
    return directTypeNode;
  }
  if (param.type !== AST_NODE_TYPES.AssignmentPattern) {
    return null;
  }
  return getAssignmentPatternObjectDestructuredTypeNode(param);
}

/**
 * Returns child nodes extracted from one visitor-key value.
 *
 * @param value - Visitor-key value from an AST node.
 * @returns Child nodes from the value.
 */
function getVisitorArrayNodes(value: unknown): ReadonlyArray<TSESTree.Node> {
  if (Array.isArray(value)) {
    return value.filter(isNodeLike);
  }
  return isNodeLike(value) ? [value] : [];
}

/**
 * Returns direct child nodes for an AST node using source-code visitor keys.
 *
 * @param node - Node whose children should be collected.
 * @param sourceCode - ESLint source code helper.
 * @returns Child nodes for traversal.
 */
function getVisitorChildNodes(
  node: TSESTree.Node,
  sourceCode: Readonly<TSESLint.SourceCode>,
): ReadonlyArray<TSESTree.Node> {
  const childNodes: TSESTree.Node[] = [];
  for (const key of sourceCode.visitorKeys[node.type]) {
    childNodes.push(...getVisitorArrayNodes(Reflect.get(node, key)));
  }
  return childNodes;
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
  const pendingNodes: TSESTree.Node[] = [node];
  while (pendingNodes.length > 0) {
    const [current] = pendingNodes.splice(-1, 1);
    if (current.type === AST_NODE_TYPES.TSTypeLiteral) {
      return true;
    }
    pendingNodes.push(...getVisitorChildNodes(current, sourceCode));
  }
  return false;
}

/**
 * Returns true when a value is AST-node-like.
 *
 * @param value - Unknown value.
 * @returns True when the value exposes a string node type.
 */
function isNodeLike(value: unknown): value is TSESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value;
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
