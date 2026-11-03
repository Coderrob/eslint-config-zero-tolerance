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
import { ioOptionsIndex, resolveIoApi, type IIoApi } from './support/io-api';
import { getArgument, resolveLocalValue } from './support/local-values';
import { readOption } from './support/object-options';
import { createRule } from './support/rule-factory';
import { getCalleeName } from './support/security-ast';
import { isRuntimeTimeoutObject, isTimeoutExpression } from './support/timeout-value';

interface IRequireTimeoutForIoOptions {
  additionalIoFunctionNames?: readonly string[];
  approvedWrapperNames?: readonly string[];
  checkTests?: boolean;
}

type IoContext = Readonly<TSESLint.RuleContext<'missingTimeout', [IRequireTimeoutForIoOptions?]>>;

const INVALID_SIGNAL_TYPES = new Set([
  AST_NODE_TYPES.Literal,
  AST_NODE_TYPES.UnaryExpression,
  AST_NODE_TYPES.ObjectExpression,
  AST_NODE_TYPES.ArrayExpression,
]);

const SUPERAGENT_CLIENT = 'superagent';

const FETCH_CLIENT = 'fetch';

const UNDEFINED_NAME = 'undefined';

const TIMEOUT_METHOD = 'timeout';

const GOT_CLIENT = 'got';

const REQUEST_CLIENT = 'request';

const SYNC_SUFFIX = 'Sync';

/**
 * Finds an immediate timeout chain without accepting unrelated method calls.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function chainedTimeoutCall(
  node: Readonly<TSESTree.CallExpression>,
): TSESTree.CallExpression | null {
  const member = node.parent;
  if (member.type !== AST_NODE_TYPES.MemberExpression || getCalleeName(member) !== TIMEOUT_METHOD)
    return null;
  return member.parent.type === AST_NODE_TYPES.CallExpression ? member.parent : null;
}

/**
 * Checks recognized IO calls against their API's actual configuration position.
 * @param context - ESLint rule context.
 * @param node - AST node to inspect.
 */
function checkIoCall(context: Readonly<IoContext>, node: Readonly<TSESTree.CallExpression>): void {
  const options = context.options[0] ?? {};
  if (isApprovedWrapper(node, options)) return;
  const api = resolveIoApi(context.sourceCode, node.callee) ?? configuredApi(node, options);
  reportMissingCancellation(context, node, api);
}

/**
 * Treats configured direct wrappers as URL/options calls.
 * @param node - AST node to inspect.
 * @param options - Configured rule options.
 * @returns The result of the described check or resolution.
 */
function configuredApi(
  node: Readonly<TSESTree.CallExpression>,
  options: Readonly<IRequireTimeoutForIoOptions>,
): IIoApi | null {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) return null;
  const names = options.additionalIoFunctionNames ?? [];
  return names.includes(node.callee.name) ? { client: 'custom', method: '' } : null;
}

/**
 * Skips test files unless explicitly requested.
 * @param context - ESLint rule context.
 * @returns The result of the described check or resolution.
 */
function createListeners(context: Readonly<IoContext>): TSESLint.RuleListener {
  if (context.options[0]?.checkTests !== true && isTestFile(context.filename)) return {};
  return { CallExpression: checkIoCall.bind(undefined, context) };
}

/**
 * Accepts cancellation only through supported option fields or SuperAgent chains.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param api - Recognized IO client and method.
 * @returns The result of the described check or resolution.
 */
function hasCancellation(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.CallExpression>,
  api: Readonly<IIoApi>,
): boolean {
  if (api.client === SUPERAGENT_CLIENT) return hasChainedTimeout(source, node);
  const options = getArgument(node, ioOptionsIndex(source, node, api));
  return options !== null && hasCancellationOptions(source, options, api);
}

/**
 * Applies API-specific option field support.
 * @param source - Source code and lexical scopes.
 * @param options - Configured rule options.
 * @param api - Recognized IO client and method.
 * @returns The result of the described check or resolution.
 */
function hasCancellationOptions(
  source: Readonly<TSESLint.SourceCode>,
  options: Readonly<TSESTree.Node>,
  api: Readonly<IIoApi>,
): boolean {
  if (isSignalSupported(api) && isUsableSignal(source, readOption(source, options, 'signal')))
    return true;
  if (api.client === FETCH_CLIENT) return false;
  return isUsableTimeout(source, readOption(source, options, 'timeout'), api.client);
}

/**
 * Recognizes an immediate SuperAgent timeout call.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function hasChainedTimeout(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const call = chainedTimeoutCall(node);
  return call !== null && isUsableTimeout(source, getArgument(call, 0), SUPERAGENT_CLIENT);
}

/**
 * Checks documented Got and SuperAgent timeout object fields.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param client - Recognized IO client name.
 * @returns The result of the described check or resolution.
 */
function hasObjectTimeout(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.ObjectExpression>,
  client: string,
): boolean {
  const keys = timeoutKeys(client);
  return keys.some((key) => isUsableTimeout(source, readOption(source, node, key), 'numeric'));
}

/**
 * Matches explicitly approved wrappers.
 * @param node - AST node to inspect.
 * @param options - Configured rule options.
 * @returns The result of the described check or resolution.
 */
function isApprovedWrapper(
  node: Readonly<TSESTree.CallExpression>,
  options: Readonly<IRequireTimeoutForIoOptions>,
): boolean {
  return (options.approvedWrapperNames ?? []).includes(getCalleeName(node.callee) ?? '');
}

/**
 * Validates numeric client timeouts or Got's runtime timeout options object.
 * @param source - Source code and lexical bindings.
 * @param value - Input value for this operation.
 * @param client - Input client for this operation.
 * @returns The result of the described check.
 */
function isClientTimeoutValue(
  source: Readonly<TSESLint.SourceCode>,
  value: Readonly<TSESTree.Node>,
  client: string,
): boolean {
  return client === GOT_CLIENT
    ? isRuntimeTimeoutObject(source, value)
    : isTimeoutExpression(source, value);
}

/**
 * Rejects AbortSignal for APIs that do not implement it.
 * @param api - Input api for this operation.
 * @returns The result of the described check.
 */
function isSignalSupported(api: Readonly<IIoApi>): boolean {
  return api.client !== REQUEST_CLIENT && !api.method.endsWith(SYNC_SUFFIX);
}

/**
 * Rejects obviously invalid signals while accepting runtime signal expressions.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function isUsableSignal(
  source: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node | null,
): boolean {
  if (node === null) return false;
  const value = resolveLocalValue(source, node);
  if (INVALID_SIGNAL_TYPES.has(value.type)) return false;
  return value.type !== AST_NODE_TYPES.Identifier || value.name !== UNDEFINED_NAME;
}

/**
 * Accepts positive numeric timeouts and API-specific timeout objects.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param client - Recognized IO client name.
 * @returns The result of the described check or resolution.
 */
function isUsableTimeout(
  source: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node | null,
  client: string,
): boolean {
  if (node === null) return false;
  const value = resolveLocalValue(source, node);
  if (value.type === AST_NODE_TYPES.ObjectExpression)
    return hasObjectTimeout(source, value, client);
  return isClientTimeoutValue(source, value, client);
}

/**
 * Reports recognized calls lacking their supported cancellation configuration.
 * @param context - ESLint rule execution context.
 * @param node - AST node to inspect.
 * @param api - Recognized IO client and method.
 */
function reportMissingCancellation(
  context: Readonly<IoContext>,
  node: Readonly<TSESTree.CallExpression>,
  api: IIoApi | null,
): void {
  if (api === null || hasCancellation(context.sourceCode, node, api)) return;
  context.report({ node, messageId: 'missingTimeout' });
}

/**
 * Returns the timeout phase names supported by a client.
 * @param client - Recognized IO client name.
 * @returns The result of the described check or resolution.
 */
function timeoutKeys(client: string): readonly string[] {
  if (client === GOT_CLIENT)
    return ['request', 'lookup', 'connect', 'secureConnect', 'socket', 'send', 'response'];
  return client === SUPERAGENT_CLIENT ? ['response', 'deadline'] : [];
}

/** Requires timeout or cancellation configuration at the supported IO options position. */
export const requireTimeoutForIo = createRule({
  name: 'require-timeout-for-io',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require API-specific timeout or cancellation options for external IO calls',
    },
    messages: {
      missingTimeout:
        'IO calls must configure a supported timeout or cancellation signal in their options argument.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          approvedWrapperNames: { type: 'array', items: { type: 'string' } },
          additionalIoFunctionNames: { type: 'array', items: { type: 'string' } },
          checkTests: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createListeners,
});

export default requireTimeoutForIo;
