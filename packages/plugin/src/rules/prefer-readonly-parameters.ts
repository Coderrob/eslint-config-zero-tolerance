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
const DEFAULT_IGNORED_TYPE_NAME_PATTERNS = [
  '^Dispatch$',
  '^Function$',
  '^RefCallback$',
  '^VoidFunction$',
  '(Callback|Handler)$',
];

type PreferReadonlyParametersContext = Readonly<
  TSESLint.RuleContext<'preferReadonlyParameter', RuleOptions>
>;
type RuleOptions = [IPreferReadonlyParametersOptions?];

interface IPreferReadonlyParametersOptions {
  readonly ignoredTypeNamePatterns?: readonly string[];
}

/**
 * Checks function parameters for mutable object/array-like annotations.
 *
 * @param context - ESLint rule execution context.
 * @param node - Function-like node.
 */
function checkFunctionNode(context: Readonly<PreferReadonlyParametersContext>, node: Readonly<FunctionNode>): void {
  const ignoredTypeNamePatterns = resolveIgnoredTypeNamePatterns(context.options);
  for (const param of node.params) {
    reportIfMutableParameter(context, ignoredTypeNamePatterns, param);
  }
}

/**
 * Compiles one ignored type-name pattern.
 *
 * @param pattern - Regular expression source from rule options.
 * @returns Compiled regular expression.
 */
function createIgnoredTypeNamePattern(pattern: string): RegExp {
  return new RegExp(pattern);
}

/**
 * Creates listeners for prefer-readonly-parameters checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createPreferReadonlyParametersListeners(
  context: Readonly<PreferReadonlyParametersContext>,
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
  typeNode: Readonly<TSESTree.TypeNode>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix | null {
  const replacementType = getReadonlyReplacementTypeText(sourceCode, typeNode);
  if (replacementType === null) {
    return null;
  }
  return fixer.replaceText(typeNode, replacementType);
}

/**
 * Returns true when the pattern matches a type-reference name.
 *
 * @param typeName - Terminal type-reference name.
 * @param pattern - Compiled ignored type-name pattern.
 * @returns True when the name is ignored.
 */
function doesPatternMatchTypeName(typeName: string, pattern: Readonly<RegExp>): boolean {
  return pattern.test(typeName);
}

/**
 * Returns parameter display name for diagnostics.
 *
 * @param param - Function parameter node.
 * @returns Parameter display name.
 */
function getParameterName(param: Readonly<TSESTree.Parameter>): string {
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
  node: Readonly<TSESTree.TypeNode>,
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
 * Returns the rightmost identifier name from simple or qualified type references.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Type-reference node.
 * @returns Terminal identifier name.
 */
function getTerminalTypeReferenceName(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSTypeReference>,
): string {
  const typeName = sourceCode.getText(node.typeName);
  const qualifierIndex = typeName.lastIndexOf('.');
  if (qualifierIndex === -1) {
    return typeName;
  }
  return typeName.slice(qualifierIndex + 1);
}

/**
 * Returns true when any type-literal member is mutable.
 *
 * @param node - Type-literal node.
 * @returns True when mutable.
 */
function hasMutableTypeLiteralMembers(node: Readonly<TSESTree.TSTypeLiteral>): boolean {
  return !hasAllReadonlyPropertyMembers(node);
}

/**
 * Returns true when a type reference matches configured ignored type-name patterns.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Type-reference node.
 * @param ignoredTypeNamePatterns - Type-reference name patterns excluded from readonly checks.
 * @returns True when the type reference should not be reported.
 */
function isIgnoredTypeReference(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSTypeReference>,
  ignoredTypeNamePatterns: ReadonlyArray<RegExp>,
): boolean {
  const typeName = getTerminalTypeReferenceName(sourceCode, node);
  return ignoredTypeNamePatterns.some(doesPatternMatchTypeName.bind(undefined, typeName));
}

/**
 * Returns true when a parameter type is mutable after applying configured exclusions.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Type node.
 * @param ignoredTypeNamePatterns - Type-reference name patterns excluded from readonly checks.
 * @returns True when mutable.
 */
function isMutableParameterTypeWithOptions(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TypeNode>,
  ignoredTypeNamePatterns: ReadonlyArray<RegExp>,
): boolean {
  if (node.type === AST_NODE_TYPES.TSArrayType || node.type === AST_NODE_TYPES.TSTupleType) {
    return true;
  }
  if (isReadonlyTypeOperator(node)) {
    return false;
  }
  return isMutableStructuredType(sourceCode, node, ignoredTypeNamePatterns);
}

/**
 * Returns true when non-array structured type is mutable.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Type node.
 * @param ignoredTypeNamePatterns - Type-reference name patterns excluded from readonly checks.
 * @returns True when mutable.
 */
function isMutableStructuredType(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TypeNode>,
  ignoredTypeNamePatterns: ReadonlyArray<RegExp>,
): boolean {
  if (node.type === AST_NODE_TYPES.TSTypeLiteral) {
    return hasMutableTypeLiteralMembers(node);
  }
  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    return isMutableTypeReference(sourceCode, node, ignoredTypeNamePatterns);
  }
  return false;
}

/**
 * Returns true when a type reference represents mutable parameter typing.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Type-reference node.
 * @param ignoredTypeNamePatterns - Type-reference name patterns excluded from readonly checks.
 * @returns True when mutable.
 */
function isMutableTypeReference(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSTypeReference>,
  ignoredTypeNamePatterns: ReadonlyArray<RegExp>,
): boolean {
  const typeReferenceName = getTypeReferenceName(node);
  if (typeReferenceName === READONLY_ARRAY_TYPE_NAME || typeReferenceName === READONLY_TYPE_NAME) {
    return false;
  }
  return !isIgnoredTypeReference(sourceCode, node, ignoredTypeNamePatterns);
}

/**
 * Returns true when type operator is readonly.
 *
 * @param node - Type node.
 * @returns True for readonly type operator.
 */
function isReadonlyTypeOperator(node: Readonly<TSESTree.TypeNode>): boolean {
  return node.type === AST_NODE_TYPES.TSTypeOperator && node.operator === READONLY_OPERATOR;
}

/**
 * Reports mutable object/array-like parameter annotations.
 *
 * @param context - ESLint rule execution context.
 * @param ignoredTypeNamePatterns - Type-reference name patterns excluded from readonly checks.
 * @param param - Function parameter node.
 */
function reportIfMutableParameter(
  context: Readonly<PreferReadonlyParametersContext>,
  ignoredTypeNamePatterns: ReadonlyArray<RegExp>,
  param: Readonly<TSESTree.Parameter>,
): void {
  const typeNode = getParameterTypeNode(param);
  if (
    typeNode === null ||
    !isMutableParameterTypeWithOptions(context.sourceCode, typeNode, ignoredTypeNamePatterns)
  ) {
    return;
  }
  context.report({
    node: param,
    messageId: 'preferReadonlyParameter',
    data: { name: getParameterName(param) },
    fix: createReadonlyParameterFix.bind(undefined, context.sourceCode, typeNode),
  });
}

/**
 * Compiles configured ignored type-name patterns.
 *
 * @param options - Rule options.
 * @returns Configured ignore patterns.
 */
function resolveIgnoredTypeNamePatterns(options: Readonly<RuleOptions>): ReadonlyArray<RegExp> {
  const option = options[0];
  const patterns = option?.ignoredTypeNamePatterns ?? DEFAULT_IGNORED_TYPE_NAME_PATTERNS;
  return patterns.map(createIgnoredTypeNamePattern);
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
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          ignoredTypeNamePatterns: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
  },
  defaultOptions: [{}],
  create: createPreferReadonlyParametersListeners,
});

export default preferReadonlyParameters;
