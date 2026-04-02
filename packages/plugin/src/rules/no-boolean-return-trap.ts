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
import { ANONYMOUS_FUNCTION_NAME } from '../constants';
import type { FunctionNode } from '../helpers/ast-guards';
import { resolveFunctionName } from '../helpers/ast-helpers';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

const PREDICATE_NAME_PATTERN = /^(is|has|can|should)[A-Z_]/;
const PROMISE_IDENTIFIER = 'Promise';

type NoBooleanReturnTrapContext = Readonly<TSESLint.RuleContext<'noBooleanReturnTrap', []>>;

/**
 * Checks one function-like node for ambiguous boolean return typing.
 *
 * @param context - ESLint rule execution context.
 * @param node - Function node.
 */
function checkFunctionNode(context: NoBooleanReturnTrapContext, node: FunctionNode): void {
  const functionName = resolveFunctionName(node);
  const returnTypeAnnotation = node.returnType;
  if (
    returnTypeAnnotation === undefined ||
    !isTrapCandidate(functionName, returnTypeAnnotation.typeAnnotation)
  ) {
    return;
  }
  context.report({
    node: returnTypeAnnotation,
    messageId: 'noBooleanReturnTrap',
    data: { name: functionName },
  });
}

/**
 * Creates listeners for no-boolean-return-trap checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoBooleanReturnTrapListeners(
  context: NoBooleanReturnTrapContext,
): TSESLint.RuleListener {
  return createFunctionNodeListeners(checkFunctionNode.bind(undefined, context));
}

/**
 * Returns first type argument for a type-reference node.
 *
 * @param node - Type-reference node.
 * @returns First type argument when present.
 */
function getFirstTypeArgument(node: TSESTree.TSTypeReference): TSESTree.TypeNode | null {
  return node.typeArguments?.params[0] ?? null;
}

/**
 * Returns true when a type annotation is a boolean-like return type.
 *
 * @param node - Type node.
 * @returns True when node is boolean or Promise<boolean>.
 */
function isBooleanLikeReturnType(node: TSESTree.TypeNode): boolean {
  if (node.type === AST_NODE_TYPES.TSBooleanKeyword) {
    return true;
  }
  if (node.type !== AST_NODE_TYPES.TSTypeReference) {
    return false;
  }
  return isPromiseBooleanType(node);
}

/**
 * Returns true when function name is an allowed predicate-style API.
 *
 * @param functionName - Function name.
 * @returns True when predicate naming is used.
 */
function isPredicateName(functionName: string): boolean {
  return PREDICATE_NAME_PATTERN.test(functionName);
}

/**
 * Returns true when a type reference is Promise<boolean>.
 *
 * @param node - Type-reference node.
 * @returns True when promise contains boolean type argument.
 */
function isPromiseBooleanType(node: TSESTree.TSTypeReference): boolean {
  if (!isPromiseTypeName(node.typeName)) {
    return false;
  }
  const firstTypeArgument = getFirstTypeArgument(node);
  if (firstTypeArgument === null) {
    return false;
  }
  return firstTypeArgument.type === AST_NODE_TYPES.TSBooleanKeyword;
}

/**
 * Returns true when type name is Promise identifier.
 *
 * @param node - Type name node.
 * @returns True when Promise.
 */
function isPromiseTypeName(node: TSESTree.EntityName): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === PROMISE_IDENTIFIER;
}

/**
 * Returns true when function and return type should be reported as a trap.
 *
 * @param functionName - Resolved function name.
 * @param returnTypeNode - Return type node, when present.
 * @returns True when this is a boolean-return trap.
 */
function isTrapCandidate(
  functionName: string,
  returnTypeNode: TSESTree.TypeNode | undefined,
): boolean {
  if (
    returnTypeNode === undefined ||
    functionName === ANONYMOUS_FUNCTION_NAME ||
    isPredicateName(functionName)
  ) {
    return false;
  }
  return isBooleanLikeReturnType(returnTypeNode);
}

/** Disallows ambiguous boolean-return APIs outside predicate naming conventions. */
export const noBooleanReturnTrap = createRule({
  name: 'no-boolean-return-trap',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow ambiguous boolean-return APIs; prefer predicate naming or richer result types for clearer call sites',
    },
    messages: {
      noBooleanReturnTrap:
        'Function "{{name}}" returns boolean; prefer predicate naming (is/has/can/should) or a richer return type.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoBooleanReturnTrapListeners,
});

export default noBooleanReturnTrap;
