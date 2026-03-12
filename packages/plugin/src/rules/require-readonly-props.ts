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
import { isIdentifierNode } from '../ast-guards';
import { createRule } from '../rule-factory';

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;
type RequireReadonlyPropsContext = Readonly<TSESLint.RuleContext<'requireReadonlyProps', []>>;

interface IFunctionState {
  node: FunctionNode;
  hasJsxReturn: boolean;
  propsNode: TSESTree.Parameter | null;
}

const PASCAL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/;
const READONLY_TYPE_NAME = 'Readonly';

/**
 * Builds tracked state for one function-like node.
 *
 * @param node - Function node being entered.
 * @returns Initialized function state.
 */
function buildFunctionState(node: FunctionNode): IFunctionState {
  const componentName = getComponentName(node);
  if (!isPascalCaseName(componentName)) {
    return { node, hasJsxReturn: false, propsNode: null };
  }
  const isJsxArrowBody =
    node.type === AST_NODE_TYPES.ArrowFunctionExpression &&
    node.body.type !== AST_NODE_TYPES.BlockStatement &&
    isJsxExpression(node.body);
  return { node, hasJsxReturn: isJsxArrowBody, propsNode: getMutablePropsNode(getFirstPropsParam(node.params)) };
}

/**
 * Creates listeners for enforcing readonly typing on JSX component props.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for rule traversal.
 */
function createRequireReadonlyPropsListeners(context: RequireReadonlyPropsContext): TSESLint.RuleListener {
  const stateStack: IFunctionState[] = [];
  return {
    ArrowFunctionExpression: onArrowFunctionEnter.bind(undefined, stateStack),
    'ArrowFunctionExpression:exit': onArrowFunctionExit.bind(undefined, context, stateStack),
    FunctionDeclaration: onFunctionDeclarationEnter.bind(undefined, stateStack),
    'FunctionDeclaration:exit': onFunctionDeclarationExit.bind(undefined, context, stateStack),
    FunctionExpression: onFunctionExpressionEnter.bind(undefined, stateStack),
    'FunctionExpression:exit': onFunctionExpressionExit.bind(undefined, context, stateStack),
    ReturnStatement: onReturnStatement.bind(undefined, stateStack),
  };
}

/**
 * Returns type annotation from an assignment-pattern parameter.
 *
 * @param param - Assignment-pattern parameter.
 * @returns Type annotation when present.
 */
function getAssignmentPatternTypeAnnotation(
  param: TSESTree.AssignmentPattern,
): TSESTree.TSTypeAnnotation | null {
  const left = param.left;
  if (left.type === AST_NODE_TYPES.Identifier || left.type === AST_NODE_TYPES.ObjectPattern) {
    return left.typeAnnotation ?? null;
  }
  return null;
}

/**
 * Returns a component name when function declaration shape provides one.
 *
 * @param node - Function-like node.
 * @returns Component name, or null when unavailable.
 */
function getComponentName(node: FunctionNode): string | null {
  return node.type === AST_NODE_TYPES.FunctionDeclaration
    ? getFunctionDeclarationName(node)
    : getVariableComponentName(node);
}

/**
 * Returns function declaration identifier name when present.
 *
 * @param node - Function declaration node.
 * @returns Declared name, or null.
 */
function getFunctionDeclarationName(node: TSESTree.FunctionDeclaration): string | null {
  return node.id?.name ?? null;
}

/**
 * Returns the first non-`this` parameter from a function parameter list.
 * TypeScript allows an explicit `this:` pseudo-parameter as the first entry;
 * the actual props parameter follows it.
 *
 * @param params - Function parameter list.
 * @returns First non-`this` parameter, or undefined when none exists.
 */
function getFirstPropsParam(params: TSESTree.Parameter[]): TSESTree.Parameter | undefined {
  return params.find(
    (param) => !(param.type === AST_NODE_TYPES.Identifier && param.name === 'this'),
  );
}

/**
 * Returns first parameter when it does not enforce readonly typing.
 *
 * @param firstParam - First function parameter.
 * @returns Parameter node when mutable; otherwise null.
 */
function getMutablePropsNode(firstParam: TSESTree.Parameter | undefined): TSESTree.Parameter | null {
  if (firstParam === undefined) {
    return null;
  }
  return isMutablePropsParameter(firstParam) ? firstParam : null;
}

/**
 * Returns type annotation from supported parameter node shapes.
 *
 * @param param - Function parameter.
 * @returns Parameter type annotation when present.
 */
function getParameterTypeAnnotation(param: TSESTree.Parameter): TSESTree.TSTypeAnnotation | null {
  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    return getAssignmentPatternTypeAnnotation(param);
  }
  if (isDirectlyTypedParameter(param)) {
    return param.typeAnnotation ?? null;
  }
  return null;
}

/**
 * Returns wrapped expression for TypeScript satisfies wrapper nodes around JSX.
 *
 * @param expression - Candidate expression.
 * @returns Wrapped expression when satisfies is used.
 */
function getSatisfiesWrappedExpression(expression: TSESTree.Expression): TSESTree.Expression | null {
  if (expression.type === AST_NODE_TYPES.TSSatisfiesExpression) {
    return expression.expression;
  }
  return null;
}

/**
 * Returns variable-assigned component name for function expressions and arrows.
 *
 * @param node - Function-like node.
 * @returns Component name, or null when unavailable.
 */
function getVariableComponentName(
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
): string | null {
  const parent = node.parent;
  if (parent.type !== AST_NODE_TYPES.VariableDeclarator || !isIdentifierNode(parent.id)) {
    return null;
  }
  return getVariableDeclaratorName(parent.id);
}

/**
 * Returns declared variable name when parent is an identifier declarator.
 *
 * @param parent - Parent node for a function expression.
 * @returns Variable name.
 */
function getVariableDeclaratorName(identifier: TSESTree.Identifier): string {
  return identifier.name;
}

/**
 * Returns wrapped expression for TypeScript wrapper nodes around JSX.
 *
 * @param expression - Candidate expression.
 * @returns Wrapped expression when wrapper is supported.
 */
function getWrappedJsxExpression(expression: TSESTree.Expression): TSESTree.Expression | null {
  const satisfiesExpression = getSatisfiesWrappedExpression(expression);
  if (satisfiesExpression !== null) {
    return satisfiesExpression;
  }
  if (expression.type === AST_NODE_TYPES.TSAsExpression) {
    return expression.expression;
  }
  if (expression.type === AST_NODE_TYPES.TSNonNullExpression) {
    return expression.expression;
  }
  return null;
}

/**
 * Returns true when `Readonly<T>` has at least one type argument.
 *
 * @param node - Type-reference node.
 * @returns True when type arguments exist.
 */
function hasReadonlyTypeArgument(node: TSESTree.TSTypeReference): boolean {
  return node.typeArguments !== undefined && node.typeArguments.params.length > 0;
}

/**
 * Returns true when every type literal member is a readonly property signature.
 *
 * @param node - Type-literal node.
 * @returns True when all members are readonly properties.
 */
function hasReadonlyTypeMembers(node: TSESTree.TSTypeLiteral): boolean {
  for (const member of node.members) {
    if (member.type !== AST_NODE_TYPES.TSPropertySignature || !member.readonly) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true when parameter type can carry a direct type annotation.
 *
 * @param param - Function parameter.
 * @returns True for identifier/object/rest parameters.
 */
function isDirectlyTypedParameter(
  param: TSESTree.Parameter,
): param is TSESTree.Identifier | TSESTree.ObjectPattern | TSESTree.RestElement {
  return (
    param.type === AST_NODE_TYPES.Identifier ||
    param.type === AST_NODE_TYPES.ObjectPattern ||
    param.type === AST_NODE_TYPES.RestElement
  );
}

/**
 * Returns true when an expression resolves to JSX output.
 *
 * @param expression - Candidate expression.
 * @returns True when expression is JSX.
 */
function isJsxExpression(expression: TSESTree.Expression): boolean {
  if (expression.type === AST_NODE_TYPES.JSXElement || expression.type === AST_NODE_TYPES.JSXFragment) {
    return true;
  }
  const wrappedExpression = getWrappedJsxExpression(expression);
  if (wrappedExpression !== null) {
    return isJsxExpression(wrappedExpression);
  }
  return false;
}

/**
 * Returns true when parameter type does not enforce readonly props.
 *
 * @param param - Parameter node.
 * @returns True when parameter is mutable.
 */
function isMutablePropsParameter(param: TSESTree.Parameter): boolean {
  const typeAnnotation = getParameterTypeAnnotation(param);
  if (typeAnnotation === null) {
    return true;
  }
  return !isReadonlyPropsType(typeAnnotation.typeAnnotation);
}

/**
 * Returns true when a component identifier matches PascalCase convention.
 *
 * @param name - Candidate function name.
 * @returns True for PascalCase names.
 */
function isPascalCaseName(name: string | null): boolean {
  return name !== null && PASCAL_CASE_PATTERN.test(name);
}

/**
 * Returns true when a type node represents readonly props.
 *
 * @param node - Type node to evaluate.
 * @returns True when props are readonly.
 */
function isReadonlyPropsType(node: TSESTree.TypeNode): boolean {
  if (node.type === AST_NODE_TYPES.TSTypeLiteral) {
    return hasReadonlyTypeMembers(node);
  }
  if (node.type !== AST_NODE_TYPES.TSTypeReference) {
    return false;
  }
  return isReadonlyTypeReference(node);
}

/**
 * Returns true when a type reference is `Readonly<...>`.
 *
 * @param node - Type-reference node.
 * @returns True when node references `Readonly<T>`.
 */
function isReadonlyTypeReference(node: TSESTree.TSTypeReference): boolean {
  if (node.typeName.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  if (node.typeName.name !== READONLY_TYPE_NAME) {
    return false;
  }
  return hasReadonlyTypeArgument(node);
}

/**
 * Marks the active function state as JSX-returning when applicable.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Return statement node.
 */
function markJsxReturn(stateStack: IFunctionState[], node: TSESTree.ReturnStatement): void {
  const currentState = stateStack.at(-1);
  if (currentState === undefined || node.argument === null) {
    return;
  }
  if (isJsxExpression(node.argument)) {
    currentState.hasJsxReturn = true;
  }
}

/**
 * Handles arrow function entry by pushing a new function state.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Arrow function node.
 */
function onArrowFunctionEnter(stateStack: IFunctionState[], node: TSESTree.ArrowFunctionExpression): void {
  stateStack.push(buildFunctionState(node));
}

/**
 * Handles arrow function exit and reports missing readonly props when needed.
 *
 * @param context - ESLint rule execution context.
 * @param stateStack - Active function-state stack.
 * @param node - Arrow function node.
 */
function onArrowFunctionExit(
  context: RequireReadonlyPropsContext,
  stateStack: IFunctionState[],
  node: TSESTree.ArrowFunctionExpression,
): void {
  popAndReportReadonlyViolation(context, stateStack, node);
}

/**
 * Handles function declaration entry by pushing a new function state.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Function declaration node.
 */
function onFunctionDeclarationEnter(
  stateStack: IFunctionState[],
  node: TSESTree.FunctionDeclaration,
): void {
  stateStack.push(buildFunctionState(node));
}

/**
 * Handles function declaration exit and reports missing readonly props when needed.
 *
 * @param context - ESLint rule execution context.
 * @param stateStack - Active function-state stack.
 * @param node - Function declaration node.
 */
function onFunctionDeclarationExit(
  context: RequireReadonlyPropsContext,
  stateStack: IFunctionState[],
  node: TSESTree.FunctionDeclaration,
): void {
  popAndReportReadonlyViolation(context, stateStack, node);
}

/**
 * Handles function expression entry by pushing a new function state.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Function expression node.
 */
function onFunctionExpressionEnter(
  stateStack: IFunctionState[],
  node: TSESTree.FunctionExpression,
): void {
  stateStack.push(buildFunctionState(node));
}

/**
 * Handles function expression exit and reports missing readonly props when needed.
 *
 * @param context - ESLint rule execution context.
 * @param stateStack - Active function-state stack.
 * @param node - Function expression node.
 */
function onFunctionExpressionExit(
  context: RequireReadonlyPropsContext,
  stateStack: IFunctionState[],
  node: TSESTree.FunctionExpression,
): void {
  popAndReportReadonlyViolation(context, stateStack, node);
}

/**
 * Handles return statements for JSX-return tracking.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Return statement node.
 */
function onReturnStatement(stateStack: IFunctionState[], node: TSESTree.ReturnStatement): void {
  markJsxReturn(stateStack, node);
}

/**
 * Pops function state and reports readonly-props violations for components.
 *
 * @param context - ESLint rule execution context.
 * @param stateStack - Active function-state stack.
 * @param node - Function node exiting traversal.
 */
function popAndReportReadonlyViolation(
  context: RequireReadonlyPropsContext,
  stateStack: IFunctionState[],
  node: FunctionNode,
): void {
  const currentState = stateStack.pop();
  if (!shouldReportReadonlyViolation(currentState, node)) {
    return;
  }
  if (currentState.propsNode !== null) {
    context.report({ node: currentState.propsNode, messageId: 'requireReadonlyProps' });
  }
}

/**
 * Returns true when popped state matches node and should be reported.
 *
 * @param state - Popped function state.
 * @param node - Function node exiting traversal.
 * @returns True when readonly props should be validated.
 */
function shouldReportReadonlyViolation(
  state: IFunctionState | undefined,
  node: FunctionNode,
): state is IFunctionState {
  if (state === undefined || !state.hasJsxReturn) {
    return false;
  }
  return state.node === node;
}

/** Requires JSX component props to be typed as readonly. */
export const requireReadonlyProps = createRule({
  name: 'require-readonly-props',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require readonly typing for JSX component props',
    },
    messages: {
      requireReadonlyProps:
        'Component props must be readonly. Type the props parameter as Readonly<Props> or use readonly members in an inline type literal.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireReadonlyPropsListeners,
});

export default requireReadonlyProps;
