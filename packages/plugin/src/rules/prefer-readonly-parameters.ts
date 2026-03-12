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

const DESTRUCTURED_PARAMETER_NAME = 'destructured parameter';
const READONLY_OPERATOR = 'readonly';
const READONLY_TYPE_NAME = 'Readonly';
const READONLY_ARRAY_TYPE_NAME = 'ReadonlyArray';

type PreferReadonlyParametersContext = Readonly<
  TSESLint.RuleContext<'preferReadonlyParameter', []>
>;

/**
 * Checks function parameters for mutable object/array-like annotations.
 *
 * @param context - ESLint rule execution context.
 * @param node - Function-like node.
 */
function checkFunctionNode(context: PreferReadonlyParametersContext, node: FunctionNode): void {
  for (const param of node.params) {
    reportIfMutableParameter(context, param);
  }
}

/**
 * Creates listeners for prefer-readonly-parameters checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createPreferReadonlyParametersListeners(
  context: PreferReadonlyParametersContext,
): TSESLint.RuleListener {
  return {
    ArrowFunctionExpression: checkFunctionNode.bind(undefined, context),
    FunctionDeclaration: checkFunctionNode.bind(undefined, context),
    FunctionExpression: checkFunctionNode.bind(undefined, context),
  };
}

/**
 * Returns parameter name for assignment-pattern shapes.
 *
 * @param param - Assignment-pattern parameter.
 * @returns Parameter display name.
 */
function getAssignmentPatternParameterName(param: TSESTree.AssignmentPattern): string {
  const simpleName = getSimpleParameterName(param.left);
  if (simpleName !== null) {
    return simpleName;
  }
  return DESTRUCTURED_PARAMETER_NAME;
}

/**
 * Returns assignment-pattern parameter type annotation.
 *
 * @param param - Assignment-pattern parameter.
 * @returns Type node when present.
 */
function getAssignmentPatternTypeNode(param: TSESTree.AssignmentPattern): TSESTree.TypeNode | null {
  return param.left.typeAnnotation?.typeAnnotation ?? null;
}

/**
 * Returns parameter display name for diagnostics.
 *
 * @param param - Function parameter node.
 * @returns Parameter display name.
 */
function getParameterName(param: TSESTree.Parameter): string {
  if (param.type === AST_NODE_TYPES.TSParameterProperty) {
    return getTSParameterPropertyName(param);
  }
  const simpleName = getSimpleParameterName(param);
  if (simpleName !== null) {
    return simpleName;
  }
  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    return getAssignmentPatternParameterName(param);
  }
  return DESTRUCTURED_PARAMETER_NAME;
}

/**
 * Returns type annotation node for supported parameter shapes.
 *
 * @param param - Function parameter node.
 * @returns Type node when present.
 */
function getParameterTypeNode(param: TSESTree.Parameter): TSESTree.TypeNode | null {
  if (param.type === AST_NODE_TYPES.TSParameterProperty) {
    return getTSParameterPropertyTypeNode(param);
  }
  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    return getAssignmentPatternTypeNode(param);
  }
  return getSimpleAnnotatedParameterTypeNode(param);
}

/**
 * Returns parameter type for non-assignment parameter shapes.
 *
 * @param param - Function parameter node.
 * @returns Type node when present.
 */
function getSimpleAnnotatedParameterTypeNode(param: TSESTree.Parameter): TSESTree.TypeNode | null {
  if (!('typeAnnotation' in param)) {
    return null;
  }
  return param.typeAnnotation?.typeAnnotation ?? null;
}

/**
 * Returns simple identifier parameter name when directly available.
 *
 * @param param - Function parameter-like node.
 * @returns Identifier name when resolvable.
 */
function getSimpleParameterName(
  param:
    | TSESTree.ArrayPattern
    | TSESTree.Identifier
    | TSESTree.ObjectPattern
    | TSESTree.Parameter
    | TSESTree.RestElement,
): string | null {
  if (param.type === AST_NODE_TYPES.Identifier) {
    return param.name;
  }
  if (param.type === AST_NODE_TYPES.RestElement && param.argument.type === AST_NODE_TYPES.Identifier) {
    return param.argument.name;
  }
  return null;
}

/**
 * Returns parameter display name for constructor parameter property.
 *
 * @param param - TSParameterProperty node.
 * @returns Parameter display name.
 */
function getTSParameterPropertyName(param: TSESTree.TSParameterProperty): string {
  const inner = param.parameter;
  if (inner.type === AST_NODE_TYPES.AssignmentPattern) {
    return getAssignmentPatternParameterName(inner);
  }
  return inner.name;
}

/**
 * Returns type annotation node for constructor parameter property.
 *
 * @param param - TSParameterProperty node.
 * @returns Type node when present.
 */
function getTSParameterPropertyTypeNode(
  param: TSESTree.TSParameterProperty,
): TSESTree.TypeNode | null {
  const inner = param.parameter;
  if (inner.type === AST_NODE_TYPES.AssignmentPattern) {
    return getAssignmentPatternTypeNode(inner);
  }
  return inner.typeAnnotation?.typeAnnotation ?? null;
}

/**
 * Returns true when any type-literal member is mutable.
 *
 * @param node - Type-literal node.
 * @returns True when mutable.
 */
function hasMutableTypeLiteralMembers(node: TSESTree.TSTypeLiteral): boolean {
  for (const member of node.members) {
    if (member.type !== AST_NODE_TYPES.TSPropertySignature || !member.readonly) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a type node is mutable for parameter usage.
 *
 * @param node - Type node.
 * @returns True when mutable.
 */
function isMutableParameterType(node: TSESTree.TypeNode): boolean {
  if (node.type === AST_NODE_TYPES.TSArrayType || node.type === AST_NODE_TYPES.TSTupleType) {
    return true;
  }
  if (isReadonlyTypeOperator(node)) {
    return false;
  }
  return isMutableStructuredType(node);
}

/**
 * Returns true when non-array structured type is mutable.
 *
 * @param node - Type node.
 * @returns True when mutable.
 */
function isMutableStructuredType(node: TSESTree.TypeNode): boolean {
  if (node.type === AST_NODE_TYPES.TSTypeLiteral) {
    return hasMutableTypeLiteralMembers(node);
  }
  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    return isMutableTypeReference(node);
  }
  return false;
}

/**
 * Returns true when a type reference represents mutable parameter typing.
 *
 * @param node - Type-reference node.
 * @returns True when mutable.
 */
function isMutableTypeReference(node: TSESTree.TSTypeReference): boolean {
  if (node.typeName.type !== AST_NODE_TYPES.Identifier) {
    return true;
  }
  if (node.typeName.name === READONLY_ARRAY_TYPE_NAME || node.typeName.name === READONLY_TYPE_NAME) {
    return false;
  }
  return true;
}

/**
 * Returns true when type operator is readonly.
 *
 * @param node - Type node.
 * @returns True for readonly type operator.
 */
function isReadonlyTypeOperator(node: TSESTree.TypeNode): boolean {
  return node.type === AST_NODE_TYPES.TSTypeOperator && node.operator === READONLY_OPERATOR;
}

/**
 * Reports mutable object/array-like parameter annotations.
 *
 * @param context - ESLint rule execution context.
 * @param param - Function parameter node.
 */
function reportIfMutableParameter(
  context: PreferReadonlyParametersContext,
  param: TSESTree.Parameter,
): void {
  const typeNode = getParameterTypeNode(param);
  if (typeNode === null || !isMutableParameterType(typeNode)) {
    return;
  }
  context.report({
    node: param,
    messageId: 'preferReadonlyParameter',
    data: { name: getParameterName(param) },
  });
}

/** Requires readonly object/array-like function parameter typing. */
export const preferReadonlyParameters = createRule({
  name: 'prefer-readonly-parameters',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer readonly typing for object and array-like parameters to prevent accidental mutation of inputs',
    },
    messages: {
      preferReadonlyParameter:
        'Parameter "{{name}}" should use readonly typing (for example Readonly<T> or readonly arrays).',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferReadonlyParametersListeners,
});

export default preferReadonlyParameters;
