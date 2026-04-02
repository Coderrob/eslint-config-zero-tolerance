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
import type { FunctionNode } from '../helpers/ast-guards';
import { getParameterTypeNode } from '../helpers/ast/parameters';
import { getTypeReferenceName, hasAllReadonlyPropertyMembers } from '../helpers/ast/types';
import { getNamedParameterName } from '../helpers/parameter-helpers';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

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
  return createFunctionNodeListeners(checkFunctionNode.bind(undefined, context));
}

/**
 * Creates an autofix for mutable parameter typing when a safe textual rewrite is available.
 *
 * @param sourceCode - ESLint source code helper.
 * @param param - Function parameter node.
 * @param fixer - ESLint fixer helper.
 * @returns Rule fix for the parameter type, or null when no safe rewrite exists.
 */
function createReadonlyParameterFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  typeNode: TSESTree.TypeNode,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix | null {
  const replacementType = getReadonlyReplacementTypeText(sourceCode, typeNode);
  if (replacementType === null) {
    return null;
  }
  return fixer.replaceText(typeNode, replacementType);
}

/**
 * Returns parameter display name for diagnostics.
 *
 * @param param - Function parameter node.
 * @returns Parameter display name.
 */
function getParameterName(param: TSESTree.Parameter): string {
  if (param.type === AST_NODE_TYPES.TSParameterProperty) {
    return getNamedParameterName(param.parameter) ?? DESTRUCTURED_PARAMETER_NAME;
  }
  const name = getNamedParameterName(param);
  if (name !== null) {
    return name;
  }
  return DESTRUCTURED_PARAMETER_NAME;
}

/**
 * Returns readonly-prefixed text for tuple and array types.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Array-like type node.
 * @returns Readonly replacement text.
 */
function getReadonlyArrayLikeTypeText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.TSArrayType | TSESTree.TSTupleType,
): string {
  return `${READONLY_OPERATOR} ${sourceCode.getText(node)}`;
}

/**
 * Returns replacement text for mutable parameter typing when a safe rewrite exists.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Mutable parameter type node.
 * @returns Replacement type text, or null when autofix is unsafe.
 */
function getReadonlyReplacementTypeText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.TypeNode,
): string | null {
  if (node.type === AST_NODE_TYPES.TSArrayType || node.type === AST_NODE_TYPES.TSTupleType) {
    return getReadonlyArrayLikeTypeText(sourceCode, node);
  }
  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    return `${READONLY_TYPE_NAME}<${sourceCode.getText(node)}>`;
  }
  return null;
}

/**
 * Returns true when any type-literal member is mutable.
 *
 * @param node - Type-literal node.
 * @returns True when mutable.
 */
function hasMutableTypeLiteralMembers(node: TSESTree.TSTypeLiteral): boolean {
  return !hasAllReadonlyPropertyMembers(node);
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
  const typeReferenceName = getTypeReferenceName(node);
  if (typeReferenceName === READONLY_ARRAY_TYPE_NAME || typeReferenceName === READONLY_TYPE_NAME) {
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
    fix: createReadonlyParameterFix.bind(undefined, context.sourceCode, typeNode),
  });
}

/** Requires readonly object/array-like function parameter typing. */
export const preferReadonlyParameters = createRule({
  name: 'prefer-readonly-parameters',
  meta: {
    type: 'suggestion',
    fixable: 'code',
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
