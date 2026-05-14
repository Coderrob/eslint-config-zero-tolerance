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
import { getFunctionDeclarationName, getFunctionVariableName } from '../helpers/ast-helpers';
import { getFirstNonThisParameter, getParameterTypeAnnotation } from '../helpers/ast/parameters';
import {
  hasNamedTypeReferenceWithTypeArguments,
  hasAllReadonlyPropertyMembers,
  unwrapTsExpression,
} from '../helpers/ast/types';
import { createFunctionNodeEnterExitListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

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
function buildFunctionState(node: Readonly<FunctionNode>): IFunctionState {
  const componentName = getComponentName(node);
  if (!isPascalCaseName(componentName)) {
    return { node, hasJsxReturn: false, propsNode: null };
  }
  const isJsxArrowBody =
    node.type === AST_NODE_TYPES.ArrowFunctionExpression &&
    node.body.type !== AST_NODE_TYPES.BlockStatement &&
    isJsxExpression(node.body);
  return {
    node,
    hasJsxReturn: isJsxArrowBody,
    propsNode: getMutablePropsNode(getFirstPropsParam(node.params)),
  };
}

/**
 * Creates listeners for enforcing readonly typing on JSX component props.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for rule traversal.
 */
function createRequireReadonlyPropsListeners(
  context: Readonly<RequireReadonlyPropsContext>,
): TSESLint.RuleListener {
  const stateStack: IFunctionState[] = [];
  return {
    ...createFunctionNodeEnterExitListeners(
      onFunctionEnter.bind(undefined, stateStack),
      onFunctionExit.bind(undefined, context, stateStack),
    ),
    ReturnStatement: onReturnStatement.bind(undefined, stateStack),
  };
}

/**
 * Returns a component name when function declaration shape provides one.
 *
 * @param node - Function-like node.
 * @returns Component name, or null when unavailable.
 */
function getComponentName(node: Readonly<FunctionNode>): string | null {
  return node.type === AST_NODE_TYPES.FunctionDeclaration
    ? getFunctionDeclarationName(node)
    : getFunctionVariableName(node);
}

/**
 * Returns the first non-`this` parameter from a function parameter list.
 * TypeScript allows an explicit `this:` pseudo-parameter as the first entry;
 * the actual props parameter follows it.
 *
 * @param params - Function parameter list.
 * @returns First non-`this` parameter, or undefined when none exists.
 */
function getFirstPropsParam(params: readonly TSESTree.Parameter[]): TSESTree.Parameter | undefined {
  return getFirstNonThisParameter(params);
}

/**
 * Returns first parameter when it does not enforce readonly typing.
 *
 * @param firstParam - First function parameter.
 * @returns Parameter node when mutable; otherwise null.
 */
function getMutablePropsNode(
  firstParam: TSESTree.Parameter | undefined,
): TSESTree.Parameter | null {
  if (firstParam === undefined) {
    return null;
  }
  return isMutablePropsParameter(firstParam) ? firstParam : null;
}

/**
 * Returns true when every type literal member is a readonly property signature.
 *
 * @param node - Type-literal node.
 * @returns True when all members are readonly properties.
 */
function hasReadonlyTypeMembers(node: Readonly<TSESTree.TSTypeLiteral>): boolean {
  return hasAllReadonlyPropertyMembers(node);
}

/**
 * Returns true when an expression resolves to JSX output.
 *
 * @param expression - Candidate expression.
 * @returns True when expression is JSX.
 */
function isJsxExpression(expression: Readonly<TSESTree.Expression>): boolean {
  if (
    expression.type === AST_NODE_TYPES.JSXElement ||
    expression.type === AST_NODE_TYPES.JSXFragment
  ) {
    return true;
  }
  const wrappedExpression = unwrapTsExpression(expression);
  if (wrappedExpression !== expression) {
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
function isMutablePropsParameter(param: Readonly<TSESTree.Parameter>): boolean {
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
function isReadonlyPropsType(node: Readonly<TSESTree.TypeNode>): boolean {
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
function isReadonlyTypeReference(node: Readonly<TSESTree.TSTypeReference>): boolean {
  return hasNamedTypeReferenceWithTypeArguments(node, READONLY_TYPE_NAME);
}

/**
 * Marks the active function state as JSX-returning when applicable.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Return statement node.
 */
function markJsxReturn(
  stateStack: readonly IFunctionState[],
  node: Readonly<TSESTree.ReturnStatement>,
): void {
  const currentState = stateStack.at(-1);
  if (currentState === undefined || node.argument === null) {
    return;
  }
  if (isJsxExpression(node.argument)) {
    Reflect.set(currentState, 'hasJsxReturn', true);
  }
}

/**
 * Handles arrow function entry by pushing a new function state.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Arrow function node.
 */
function onFunctionEnter(
  stateStack: readonly IFunctionState[],
  node: Readonly<FunctionNode>,
): void {
  Reflect.apply(Array.prototype.push, stateStack, [buildFunctionState(node)]);
}

/**
 * Handles arrow function exit and reports missing readonly props when needed.
 *
 * @param context - ESLint rule execution context.
 * @param stateStack - Active function-state stack.
 * @param node - Arrow function node.
 */
function onFunctionExit(
  context: Readonly<RequireReadonlyPropsContext>,
  stateStack: readonly IFunctionState[],
  node: Readonly<FunctionNode>,
): void {
  popAndReportReadonlyViolation(context, stateStack, node);
}

/**
 * Handles return statements for JSX-return tracking.
 *
 * @param stateStack - Active function-state stack.
 * @param node - Return statement node.
 */
function onReturnStatement(
  stateStack: readonly IFunctionState[],
  node: Readonly<TSESTree.ReturnStatement>,
): void {
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
  context: Readonly<RequireReadonlyPropsContext>,
  stateStack: readonly IFunctionState[],
  node: Readonly<FunctionNode>,
): void {
  const currentState = Reflect.apply(Array.prototype.pop, stateStack, []);
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
  node: Readonly<FunctionNode>,
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
