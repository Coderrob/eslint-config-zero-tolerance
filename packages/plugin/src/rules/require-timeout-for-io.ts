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
import { getCalleeName, getMemberPath, hasObjectProperty } from './support/security-ast';

const FETCH_FUNCTION_NAME = 'fetch';
const TIMEOUT_METHOD_NAME = 'timeout';
const CANCELLATION_PROPERTIES = new Set(['signal', 'timeout']);
const HTTP_CLIENTS = ['axios', 'got', 'ky', 'request', 'superagent'];
const SUBPROCESS_FUNCTIONS = ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync'];

interface IRequireTimeoutForIoOptions {
  additionalIoFunctionNames?: readonly string[];
  approvedWrapperNames?: readonly string[];
  checkTests?: boolean;
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
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 */
function checkIoCall(
  context: Readonly<RequireTimeoutForIoContext>,
  options: Readonly<Required<IRequireTimeoutForIoOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (shouldSkipIoCall(context, options, node)) {
    return;
  }
  if (requiresTimeout(options, node) && !hasCancellationOption(node)) {
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
  const options = normalizeOptions(context.options[0]);
  return {
    CallExpression: checkIoCall.bind(undefined, context, options),
  };
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
    if (hasObjectProperty(argument, CANCELLATION_PROPERTIES)) {
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
 * @param node - Call expression to inspect.
 * @param calleeName - Static callee name.
 * @returns True when the call is built-in IO.
 */
function isBuiltInIoCall(node: Readonly<TSESTree.CallExpression>, calleeName: string | null): boolean {
  const directCalleeName = getDirectCalleeName(node.callee);
  return isFetchCall(directCalleeName) ||
    isHttpClientCall(node, calleeName) ||
    isSubprocessCall(directCalleeName);
}

/**
 * Returns true when a call is immediately chained to `.timeout(...)`.
 *
 * @param node - Call expression to inspect.
 * @returns True when a timeout chain follows the call.
 */
function isChainedTimeoutCall(node: Readonly<TSESTree.CallExpression>): boolean {
  const parent = node.parent;
  return parent.type === AST_NODE_TYPES.MemberExpression &&
    getCalleeName(parent) === TIMEOUT_METHOD_NAME &&
    parent.parent.type === AST_NODE_TYPES.CallExpression;
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
function isHttpClientCall(node: Readonly<TSESTree.CallExpression>, calleeName: string | null): boolean {
  return HTTP_CLIENTS.includes(getRootCallName(node) ?? calleeName ?? '');
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
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 * @returns True when a timeout is required.
 */
function requiresTimeout(
  options: Readonly<Required<IRequireTimeoutForIoOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const calleeName = getCalleeName(node.callee);
  const directCalleeName = getDirectCalleeName(node.callee);
  if (isBuiltInIoCall(node, calleeName)) {
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
