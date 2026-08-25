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
import { isTestFile } from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';
import { getCalleeName, getMemberPath } from './support/security-ast';

const CHILD_PROCESS_MODULES = ['child_process', 'node:child_process'];
const FETCH_FUNCTION_NAME = 'fetch';
const SIGNAL_PROPERTY_NAME = 'signal';
const TIMEOUT_METHOD_NAME = 'timeout';
const UNDEFINED_IDENTIFIER_NAME = 'undefined';
const HTTP_CLIENTS = ['axios', 'got', 'ky', 'request', 'superagent'];
const SUBPROCESS_FUNCTIONS = ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync'];

interface IRequireTimeoutForIoOptions {
  additionalIoFunctionNames?: readonly string[];
  approvedWrapperNames?: readonly string[];
  checkTests?: boolean;
}

interface IRequireTimeoutForIoState {
  readonly childProcessImports: Map<string, string>;
  readonly childProcessNamespaces: Set<string>;
}

enum RequireTimeoutForIoMessageId {
  MissingTimeout = 'missingTimeout',
}

type RequireTimeoutForIoContext = Readonly<
  TSESLint.RuleContext<RequireTimeoutForIoMessageId, [IRequireTimeoutForIoOptions?]>
>;

/**
 * Checks IO calls for timeout or cancellation configuration.
 *
 * @param context - ESLint rule execution context.
 * @param state - Import tracking state.
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 */
function checkIoCall(
  context: Readonly<RequireTimeoutForIoContext>,
  state: Readonly<IRequireTimeoutForIoState>,
  options: Readonly<Required<IRequireTimeoutForIoOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (shouldSkipIoCall(context, options, node)) {
    return;
  }
  if (shouldRequireTimeout(state, options, node) && !hasCancellationOption(node)) {
    context.report({ node, messageId: RequireTimeoutForIoMessageId.MissingTimeout });
  }
}

/**
 * Creates listeners for require-timeout-for-io.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireTimeoutForIoListeners(
  context: Readonly<RequireTimeoutForIoContext>,
): TSESLint.RuleListener {
  const state: IRequireTimeoutForIoState = {
    childProcessImports: new Map(),
    childProcessNamespaces: new Set(),
  };
  const options = normalizeOptions(context.options[0]);
  return {
    ImportDeclaration: trackChildProcessImports.bind(undefined, state),
    CallExpression: checkIoCall.bind(undefined, context, state, options),
  };
}

/**
 * Gets a static cancellation option property name.
 *
 * @param key - Object property key to inspect.
 * @returns The property name when statically known.
 */
function getCancellationPropertyName(
  key: Readonly<TSESTree.Expression | TSESTree.PrivateIdentifier>,
): string | null {
  if (key.type === AST_NODE_TYPES.Identifier) {
    return key.name;
  }
  if (key.type === AST_NODE_TYPES.Literal && typeof key.value === 'string') {
    return key.value;
  }
  return null;
}

/**
 * Gets an immediately chained timeout call for an IO call.
 *
 * @param node - IO call to inspect.
 * @returns Chained timeout call, or null when absent.
 */
function getChainedTimeoutCall(
  node: Readonly<TSESTree.CallExpression>,
): TSESTree.CallExpression | null {
  const parent = node.parent;
  if (parent.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }
  if (getCalleeName(parent) !== TIMEOUT_METHOD_NAME) {
    return null;
  }
  return parent.parent.type === AST_NODE_TYPES.CallExpression ? parent.parent : null;
}

/**
 * Gets the imported child_process API name for a callee.
 *
 * @param state - Import tracking state.
 * @param callee - Callee expression to inspect.
 * @returns The original child_process API name.
 */
function getChildProcessApiName(
  state: Readonly<IRequireTimeoutForIoState>,
  callee: Readonly<TSESTree.Expression>,
): string | null {
  const calleeName = getCalleeName(callee);
  const memberPath = getMemberPath(callee);
  if (calleeName !== null && state.childProcessImports.has(calleeName)) {
    return state.childProcessImports.get(calleeName) ?? null;
  }
  return getNamespacedChildProcessApiName(state, memberPath);
}

/**
 * Gets a callee name only for direct identifier calls.
 *
 * @param callee - Callee expression to inspect.
 * @returns Identifier name for direct calls.
 */
function getDirectCalleeName(callee: Readonly<TSESTree.Expression>): string | null {
  return callee.type === AST_NODE_TYPES.Identifier ? callee.name : null;
}

/**
 * Gets a namespaced child_process API name.
 *
 * @param state - Import tracking state.
 * @param memberPath - Dotted callee path.
 * @returns The API name when the path uses a tracked namespace.
 */
function getNamespacedChildProcessApiName(
  state: Readonly<IRequireTimeoutForIoState>,
  memberPath: string | null,
): string | null {
  if (memberPath === null) {
    return null;
  }
  for (const namespace of state.childProcessNamespaces) {
    if (memberPath.startsWith(`${namespace}.`)) {
      return memberPath.slice(namespace.length + 1);
    }
  }
  return null;
}

/**
 * Gets the root object name for a member call.
 *
 * @param node - Call expression to inspect.
 * @returns Root member name when available.
 */
function getRootCallName(node: Readonly<TSESTree.CallExpression>): string | null {
  return getMemberPath(node.callee)?.split('.')[0] ?? null;
}

/**
 * Returns true when any call argument contains cancellation options.
 *
 * @param node - Call expression to inspect.
 * @returns True when a cancellation option exists.
 */
function hasCancellationArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  for (const argument of node.arguments) {
    if (
      argument.type === AST_NODE_TYPES.ObjectExpression &&
      argument.properties.some(hasUsableCancellationProperty)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a call has an inline timeout or signal option.
 *
 * @param node - Call expression to inspect.
 * @returns True when cancellation configuration is present.
 */
function hasCancellationOption(node: Readonly<TSESTree.CallExpression>): boolean {
  if (isChainedTimeoutCall(node)) {
    return true;
  }
  return hasCancellationArgument(node);
}

/**
 * Returns true when a call's first argument is a positive timeout value.
 *
 * @param node - Timeout call to inspect.
 * @returns True when its first argument activates a timeout.
 */
function hasPositiveTimeoutArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  if (node.arguments.length === 0) {
    return false;
  }
  const firstArgument = node.arguments[0];
  if (firstArgument.type === AST_NODE_TYPES.SpreadElement) {
    return false;
  }
  return isPositiveTimeoutValue(firstArgument);
}

/**
 * Returns true when a timeout or signal property has a usable value.
 *
 * @param property - Object property to inspect.
 * @returns True when the property provides active cancellation configuration.
 */
function hasUsableCancellationProperty(
  property: TSESTree.Property | TSESTree.SpreadElement,
): boolean {
  if (property.type !== AST_NODE_TYPES.Property) {
    return false;
  }
  const propertyName = getCancellationPropertyName(property.key);
  if (propertyName === SIGNAL_PROPERTY_NAME) {
    return !isAbsentCancellationValue(property.value);
  }
  return propertyName === TIMEOUT_METHOD_NAME && isPositiveTimeoutValue(property.value);
}

/**
 * Returns true when an expression is explicitly null or undefined.
 *
 * @param value - Property value to inspect.
 * @returns True when the value cannot provide cancellation.
 */
function isAbsentCancellationValue(value: Readonly<TSESTree.Node>): boolean {
  return (
    (value.type === AST_NODE_TYPES.Literal && value.value === null) ||
    (value.type === AST_NODE_TYPES.Identifier && value.name === UNDEFINED_IDENTIFIER_NAME)
  );
}

/**
 * Returns true when the call is through an approved wrapper.
 *
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 * @returns True when the callee is allowlisted.
 */
function isApprovedWrapper(
  options: Readonly<Required<IRequireTimeoutForIoOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  return options.approvedWrapperNames.includes(getCalleeName(node.callee) ?? '');
}

/**
 * Returns true when a call targets a built-in IO sink.
 *
 * @param state - Import tracking state.
 * @param node - Call expression to inspect.
 * @param calleeName - Static callee name.
 * @returns True when the call is built-in IO.
 */
function isBuiltInIoCall(
  state: Readonly<IRequireTimeoutForIoState>,
  node: Readonly<TSESTree.CallExpression>,
  calleeName: string | null,
): boolean {
  const directCalleeName = getDirectCalleeName(node.callee);
  const childProcessApiName = getChildProcessApiName(state, node.callee);
  return (
    isFetchCall(directCalleeName) ||
    isHttpClientCall(node, calleeName) ||
    isSubprocessCall(directCalleeName) ||
    isSubprocessCall(childProcessApiName)
  );
}

/**
 * Returns true when a call is immediately chained to `.timeout(...)`.
 *
 * @param node - Call expression to inspect.
 * @returns True when a timeout chain follows the call.
 */
function isChainedTimeoutCall(node: Readonly<TSESTree.CallExpression>): boolean {
  const timeoutCall = getChainedTimeoutCall(node);
  return timeoutCall !== null && hasPositiveTimeoutArgument(timeoutCall);
}

/**
 * Returns true when a call is fetch.
 *
 * @param calleeName - Callee name to inspect.
 * @returns True when the callee is fetch.
 */
function isFetchCall(calleeName: string | null): boolean {
  return calleeName === FETCH_FUNCTION_NAME;
}

/**
 * Returns true when a call targets a known HTTP client.
 *
 * @param node - Call expression to inspect.
 * @param calleeName - Static callee name.
 * @returns True when the call is an HTTP client.
 */
function isHttpClientCall(
  node: Readonly<TSESTree.CallExpression>,
  calleeName: string | null,
): boolean {
  return HTTP_CLIENTS.includes(getRootCallName(node) ?? calleeName ?? '');
}

/**
 * Returns true when a timeout value is known positive or is resolved at runtime.
 *
 * @param value - Timeout expression to inspect.
 * @returns True when the value can impose a positive timeout.
 */
function isPositiveTimeoutValue(value: Readonly<TSESTree.Node>): boolean {
  if (isAbsentCancellationValue(value)) {
    return false;
  }
  if (value.type !== AST_NODE_TYPES.Literal) {
    return true;
  }
  return typeof value.value === 'number' && value.value > 0;
}

/**
 * Returns true when the current filename should be skipped.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @returns True when test files are exempt.
 */
function isSkippedFile(
  context: Readonly<RequireTimeoutForIoContext>,
  options: Readonly<Required<IRequireTimeoutForIoOptions>>,
): boolean {
  return !options.checkTests && isTestFile(context.filename);
}

/**
 * Returns true when a call targets a subprocess API.
 *
 * @param calleeName - Static callee name.
 * @returns True when the callee is a subprocess function.
 */
function isSubprocessCall(calleeName: string | null): boolean {
  return SUBPROCESS_FUNCTIONS.includes(calleeName ?? '');
}

/**
 * Applies default options for the rule.
 *
 * @param options - User supplied options.
 * @returns Normalized rule options.
 */
function normalizeOptions(
  options: IRequireTimeoutForIoOptions | undefined,
): Required<IRequireTimeoutForIoOptions> {
  if (options === undefined) {
    return { additionalIoFunctionNames: [], approvedWrapperNames: [], checkTests: false };
  }
  return normalizeProvidedOptions(options);
}

/**
 * Applies provided option values over defaults.
 *
 * @param options - User supplied options.
 * @returns Normalized rule options.
 */
function normalizeProvidedOptions(
  options: Readonly<IRequireTimeoutForIoOptions>,
): Required<IRequireTimeoutForIoOptions> {
  return {
    additionalIoFunctionNames: options.additionalIoFunctionNames ?? [],
    approvedWrapperNames: options.approvedWrapperNames ?? [],
    checkTests: options.checkTests ?? false,
  };
}

/**
 * Returns true when a call is a configured or built-in IO sink.
 *
 * @param state - Import tracking state.
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 * @returns True when a timeout is required.
 */
function shouldRequireTimeout(
  state: Readonly<IRequireTimeoutForIoState>,
  options: Readonly<Required<IRequireTimeoutForIoOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const calleeName = getCalleeName(node.callee);
  const directCalleeName = getDirectCalleeName(node.callee);
  if (isBuiltInIoCall(state, node, calleeName)) {
    return true;
  }
  return options.additionalIoFunctionNames.includes(directCalleeName ?? '');
}

/**
 * Returns true when a call should be skipped.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 * @returns True when file or wrapper exemptions apply.
 */
function shouldSkipIoCall(
  context: Readonly<RequireTimeoutForIoContext>,
  options: Readonly<Required<IRequireTimeoutForIoOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  return isSkippedFile(context, options) || isApprovedWrapper(options, node);
}

/**
 * Tracks child_process imports.
 *
 * @param state - Import tracking state.
 * @param node - Import declaration to inspect.
 */
function trackChildProcessImports(
  state: Readonly<IRequireTimeoutForIoState>,
  node: Readonly<TSESTree.ImportDeclaration>,
): void {
  if (typeof node.source.value !== 'string' || !CHILD_PROCESS_MODULES.includes(node.source.value)) {
    return;
  }
  for (const specifier of node.specifiers) {
    trackChildProcessSpecifier(state, specifier);
  }
}

/**
 * Tracks a single child_process import specifier.
 *
 * @param state - Import tracking state.
 * @param specifier - Import specifier to inspect.
 */
function trackChildProcessSpecifier(
  state: Readonly<IRequireTimeoutForIoState>,
  specifier: Readonly<TSESTree.ImportClause>,
): void {
  if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
    Reflect.apply(Set.prototype.add, state.childProcessNamespaces, [specifier.local.name]);
  }
  if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
    Reflect.apply(Map.prototype.set, state.childProcessImports, [
      specifier.local.name,
      getCalleeName(specifier.imported) ?? '',
    ]);
  }
}

/**
 * ESLint rule that requires cancellation or timeout configuration for IO.
 */
export const requireTimeoutForIo = createRule({
  name: 'require-timeout-for-io',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require timeout or cancellation options for external IO calls',
    },
    messages: {
      missingTimeout: 'IO calls must configure a timeout or cancellation signal.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          approvedWrapperNames: { type: 'array', items: { type: 'string' } },
          checkTests: { type: 'boolean' },
          additionalIoFunctionNames: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createRequireTimeoutForIoListeners,
});

export default requireTimeoutForIo;
