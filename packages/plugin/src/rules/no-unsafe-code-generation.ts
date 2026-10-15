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
import { createRule } from './support/rule-factory';
import {
  getCalleeName,
  getMemberPath,
  getStaticString,
  isDynamicString,
} from './support/security-ast';

const CODE_GENERATION_GLOBALS = ['eval', 'Function'];
const FUNCTION_CONSTRUCTOR_NAME = 'Function';
const TIMER_FUNCTIONS = ['setTimeout', 'setInterval'];
const TIMER_GLOBAL_OBJECTS = ['global', 'globalThis', 'self', 'window'];
const VM_MODULES = ['vm', 'node:vm'];
const VM_METHODS = [
  'runInThisContext',
  'runInNewContext',
  'runInContext',
  'compileFunction',
  'Script',
];

enum NoUnsafeCodeGenerationMessageId {
  UnsafeCodeGeneration = 'unsafeCodeGeneration',
}

type NoUnsafeCodeGenerationContext = Readonly<
  TSESLint.RuleContext<NoUnsafeCodeGenerationMessageId, []>
>;

interface ICodeGenerationState {
  readonly vmImports: Set<string>;
  readonly vmNamespaces: Set<string>;
}

/**
 * Checks call expressions for dynamic code execution.
 *
 * @param context - ESLint rule execution context.
 * @param state - Import tracking state.
 * @param node - Call expression to inspect.
 */
function checkCodeGenerationCall(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  state: Readonly<ICodeGenerationState>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (
    isUnsafeGlobalCall(context, node) ||
    isUnsafeTimerCall(context, node) ||
    isUnsafeVmCall(state, node)
  ) {
    context.report({ node, messageId: NoUnsafeCodeGenerationMessageId.UnsafeCodeGeneration });
  }
}

/**
 * Checks new expressions for Function and vm.Script construction.
 *
 * @param context - ESLint rule execution context.
 * @param state - Import tracking state.
 * @param node - New expression to inspect.
 */
function checkCodeGenerationNew(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  state: Readonly<ICodeGenerationState>,
  node: Readonly<TSESTree.NewExpression>,
): void {
  if (isUnsafeGlobalConstructor(context, node) || isUnsafeVmConstructor(state, node)) {
    context.report({ node, messageId: NoUnsafeCodeGenerationMessageId.UnsafeCodeGeneration });
  }
}

/**
 * Creates listeners for no-unsafe-code-generation.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoUnsafeCodeGenerationListeners(
  context: Readonly<NoUnsafeCodeGenerationContext>,
): TSESLint.RuleListener {
  const state: ICodeGenerationState = { vmImports: new Set(), vmNamespaces: new Set() };
  return {
    ImportDeclaration: trackVmImports.bind(undefined, state),
    CallExpression: checkCodeGenerationCall.bind(undefined, context, state),
    NewExpression: checkCodeGenerationNew.bind(undefined, context, state),
  };
}

/**
 * Returns true when a member path matches a vm namespace method.
 *
 * @param namespace - Imported vm namespace.
 * @param memberPath - Dotted member path.
 * @returns True when the path is a vm method.
 */
function hasVmMethodPath(namespace: string, memberPath: string): boolean {
  for (const method of VM_METHODS) {
    if (memberPath === `${namespace}.${method}`) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a member callee names a timer on a known global object.
 *
 * @param context - ESLint rule execution context.
 * @param callee - Member callee to inspect.
 * @param calleeName - Static timer method name.
 * @returns True when the member path is a known global timer.
 */
function isGlobalTimerMember(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  callee: Readonly<TSESTree.Expression>,
  calleeName: string,
): boolean {
  const memberPath = getMemberPath(callee);
  for (const globalName of TIMER_GLOBAL_OBJECTS) {
    if (
      memberPath === `${globalName}.${calleeName}` &&
      !isShadowedName(context, callee, globalName)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when an identifier is locally shadowed.
 *
 * @param context - ESLint rule execution context.
 * @param node - Callee expression to inspect.
 * @param name - Identifier name.
 * @returns True when the identifier is not the global binding.
 */
function isShadowedIdentifier(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  node: Readonly<TSESTree.Expression>,
  name: string,
): boolean {
  if (node.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  return isShadowedName(context, node, name);
}

/**
 * Returns true when a name resolves to a local definition in any enclosing scope.
 *
 * @param context - ESLint rule execution context.
 * @param node - Node whose scope should be searched.
 * @param name - Binding name to resolve.
 * @returns True when a local definition shadows the global name.
 */
function isShadowedName(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  node: Readonly<TSESTree.Node>,
  name: string,
): boolean {
  return isShadowedScope(context.sourceCode.getScope(node), name);
}

/**
 * Returns true when a scope or one of its parents defines a name locally.
 *
 * @param scope - Scope to search.
 * @param name - Binding name to resolve.
 * @returns True when an enclosing scope contains a local definition.
 */
function isShadowedScope(scope: TSESLint.Scope.Scope | null, name: string): boolean {
  if (scope === null) {
    return false;
  }
  const variable = scope.set.get(name);
  if (variable !== undefined) {
    return variable.defs.length > 0;
  }
  return isShadowedScope(scope.upper, name);
}

/**
 * Returns true when the first call argument is a string literal.
 *
 * @param node - Call expression to inspect.
 * @returns True when the first argument is a string literal.
 */
function isStringFirstArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  if (node.arguments.length === 0) {
    return false;
  }
  const firstArgument = node.arguments[0];
  return (
    firstArgument.type !== AST_NODE_TYPES.SpreadElement &&
    (getStaticString(firstArgument) !== null || isDynamicString(firstArgument))
  );
}

/**
 * Returns true when a callee is an unshadowed global timer function.
 *
 * @param context - ESLint rule execution context.
 * @param callee - Call callee to inspect.
 * @returns True when the callee resolves to a known global timer.
 */
function isTimerCallee(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  callee: Readonly<TSESTree.Expression>,
): boolean {
  const calleeName = getCalleeName(callee);
  if (!isTimerFunctionName(calleeName)) {
    return false;
  }
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return !isShadowedIdentifier(context, callee, callee.name);
  }
  return isGlobalTimerMember(context, callee, calleeName);
}

/**
 * Returns true when a static callee name is a timer function.
 *
 * @param calleeName - Static callee name.
 * @returns True when the name identifies a timer API.
 */
function isTimerFunctionName(calleeName: string | null): calleeName is string {
  return calleeName !== null && TIMER_FUNCTIONS.includes(calleeName);
}

/**
 * Returns true when a vm import specifier imports a tracked method.
 *
 * @param specifier - Import specifier to inspect.
 * @returns True when the import is a vm execution helper.
 */
function isTrackedVmImportSpecifier(
  specifier: Readonly<TSESTree.ImportClause>,
): specifier is TSESTree.ImportSpecifier {
  /* istanbul ignore next */
  return (
    specifier.type === AST_NODE_TYPES.ImportSpecifier &&
    VM_METHODS.includes(getCalleeName(specifier.imported) ?? '')
  );
}

/**
 * Returns true when a global Function constructor call is unsafe.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression to inspect.
 * @returns True when the call invokes the global Function constructor.
 */
function isUnsafeGlobalCall(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const calleeName = getCalleeName(node.callee);
  if (calleeName === null || !CODE_GENERATION_GLOBALS.includes(calleeName)) {
    return false;
  }
  return !isShadowedIdentifier(context, node.callee, calleeName);
}

/**
 * Returns true when a global Function constructor is used with new.
 *
 * @param context - ESLint rule execution context.
 * @param node - New expression to inspect.
 * @returns True when the constructor is the global Function constructor.
 */
function isUnsafeGlobalConstructor(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  node: Readonly<TSESTree.NewExpression>,
): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === FUNCTION_CONSTRUCTOR_NAME &&
    !isShadowedIdentifier(context, node.callee, node.callee.name)
  );
}

/**
 * Returns true when a timer receives a string callback.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression to inspect.
 * @returns True when the timer callback is a string literal.
 */
function isUnsafeTimerCall(
  context: Readonly<NoUnsafeCodeGenerationContext>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  if (!isTimerCallee(context, node.callee)) {
    return false;
  }
  return isStringFirstArgument(node);
}

/**
 * Returns true when a vm method call is unsafe.
 *
 * @param state - Import tracking state.
 * @param node - Call expression to inspect.
 * @returns True when the call uses a vm execution API.
 */
function isUnsafeVmCall(
  state: Readonly<ICodeGenerationState>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const memberPath = getMemberPath(node.callee);
  const calleeName = getCalleeName(node.callee);
  /* istanbul ignore next */
  return isVmMemberPath(state, memberPath) || state.vmImports.has(calleeName ?? '');
}

/**
 * Returns true when a vm constructor is unsafe.
 *
 * @param state - Import tracking state.
 * @param node - New expression to inspect.
 * @returns True when the constructor uses vm.Script.
 */
function isUnsafeVmConstructor(
  state: Readonly<ICodeGenerationState>,
  node: Readonly<TSESTree.NewExpression>,
): boolean {
  const memberPath = getMemberPath(node.callee);
  const calleeName = getCalleeName(node.callee);
  /* istanbul ignore next */
  return isVmMemberPath(state, memberPath) || state.vmImports.has(calleeName ?? '');
}

/**
 * Returns true when a member path targets an imported vm namespace.
 *
 * @param state - Import tracking state.
 * @param memberPath - Dotted member path.
 * @returns True when the path is a vm execution member.
 */
function isVmMemberPath(state: Readonly<ICodeGenerationState>, memberPath: string | null): boolean {
  /* istanbul ignore next */
  if (memberPath === null) {
    return false;
  }
  for (const namespace of state.vmNamespaces) {
    if (hasVmMethodPath(namespace, memberPath)) {
      return true;
    }
  }
  return false;
}

/**
 * Tracks imports from node vm modules.
 *
 * @param state - Import tracking state.
 * @param node - Import declaration to inspect.
 */
function trackVmImports(
  state: Readonly<ICodeGenerationState>,
  node: Readonly<TSESTree.ImportDeclaration>,
): void {
  if (typeof node.source.value !== 'string' || !VM_MODULES.includes(node.source.value)) {
    return;
  }
  for (const specifier of node.specifiers) {
    trackVmSpecifier(state, specifier);
  }
}

/**
 * Tracks a single vm import specifier.
 *
 * @param state - Import tracking state.
 * @param specifier - Import specifier to inspect.
 */
function trackVmSpecifier(
  state: Readonly<ICodeGenerationState>,
  specifier: Readonly<TSESTree.ImportClause>,
): void {
  if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
    Reflect.apply(Set.prototype.add, state.vmNamespaces, [specifier.local.name]);
  }
  if (isTrackedVmImportSpecifier(specifier)) {
    Reflect.apply(Set.prototype.add, state.vmImports, [specifier.local.name]);
  }
}

/**
 * ESLint rule that blocks dynamic code generation primitives.
 */
export const noUnsafeCodeGeneration = createRule({
  name: 'no-unsafe-code-generation',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow eval, Function constructors, string timers, and vm code execution APIs',
    },
    messages: {
      unsafeCodeGeneration: 'Dynamic code generation is not allowed.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoUnsafeCodeGenerationListeners,
});

export default noUnsafeCodeGeneration;
