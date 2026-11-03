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
import { findBinding, getArgument, resolveLocalValue } from './local-values';
import { getCalleeName } from './security-ast';

const HTTP_CLIENTS = new Set(['axios', 'got', 'ky', 'request', 'superagent']);

const SUBPROCESS_APIS = new Set([
  'spawn',
  'spawnSync',
  'exec',
  'execSync',
  'execFile',
  'execFileSync',
  'fork',
]);

const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'request',
  'postForm',
  'putForm',
  'patchForm',
]);

/** Describes a recognized IO API independently of its local import name. */
export interface IIoApi {
  client: string;
  method: string;
}

const CHILD_PROCESS_MODULES = new Set(['child_process', 'node:child_process']);

const FETCH_MODULES = new Set(['node-fetch', 'undici']);

const OBJECT_FIRST_CLIENTS = new Set(['got', 'request']);

const COMMAND_ONLY_APIS = new Set(['exec', 'execSync']);

const FETCH_METHODS = new Set(['', 'fetch']);

const CHILD_PROCESS_CLIENT = 'child_process';

const AXIOS_CLIENT = 'axios';

const FETCH_CLIENT = 'fetch';

const IMPORT_BINDING = 'ImportBinding';

const BODY_OPTIONS_INDEX = 2;

const REQUEST_METHOD = 'request';

/**
 * Handles Axios body-method and config-only overloads.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param method - Original API method name.
 * @returns The result of the described check or resolution.
 */
function axiosOptionsIndex(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.CallExpression>,
  method: string,
): number {
  if (['post', 'put', 'patch', 'postForm', 'putForm', 'patchForm'].includes(method))
    return BODY_OPTIONS_INDEX;
  if (method === REQUEST_METHOD) return 0;
  return method === '' ? objectFirstIndex(source, node) : 1;
}

/**
 * Resolves a direct global or imported API without confusing shadowed bindings.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function identifierApi(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Identifier>,
): IIoApi | null {
  const definition = findBinding(source, node)?.defs[0] ?? null;
  if (definition === null) return knownApi(node.name, '');
  return importDefinitionApi(definition);
}

/**
 * Resolves import bindings without accepting import-equals declarations.
 * @param definition - Variable or import definition.
 * @returns The result of the described check or resolution.
 */
function importDefinitionApi(definition: Readonly<TSESLint.Scope.Definition>): IIoApi | null {
  if (definition.type !== IMPORT_BINDING) return null;
  if (definition.parent.type !== AST_NODE_TYPES.ImportDeclaration) return null;
  return importedApi(definition.parent.source.value, importedMethod(definition.node));
}

/**
 * Maps module exports to supported clients.
 * @param moduleName - Imported module specifier.
 * @param method - Original API method name.
 * @returns The result of the described check or resolution.
 */
function importedApi(moduleName: string, method: string): IIoApi | null {
  if (CHILD_PROCESS_MODULES.has(moduleName)) return { client: 'child_process', method };
  if (FETCH_MODULES.has(moduleName)) return { client: 'fetch', method };
  return knownApi(moduleName, method);
}

/**
 * Reads the original exported name of an aliased import.
 * @param specifier - Import specifier being inspected.
 * @returns The result of the described check or resolution.
 */
function importedMethod(specifier: Readonly<TSESTree.Node>): string {
  return specifier.type === AST_NODE_TYPES.ImportSpecifier
    ? (getCalleeName(specifier.imported) ?? '')
    : '';
}

/**
 * Selects the actual options argument, never a payload object.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param api - Recognized IO client and method.
 * @returns The result of the described check or resolution.
 */
export function ioOptionsIndex(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.CallExpression>,
  api: Readonly<IIoApi>,
): number {
  if (api.client === CHILD_PROCESS_CLIENT) return subprocessOptionsIndex(source, node, api.method);
  if (api.client === AXIOS_CLIENT) return axiosOptionsIndex(source, node, api.method);
  return OBJECT_FIRST_CLIENTS.has(api.client) ? objectFirstIndex(source, node) : 1;
}

/**
 * Excludes constructors, factories, and unrelated namespace members.
 * @param api - Recognized IO client and method.
 * @returns The result of the described check or resolution.
 */
function isIoMethod(api: Readonly<IIoApi>): boolean {
  if (api.client === CHILD_PROCESS_CLIENT) return SUBPROCESS_APIS.has(api.method);
  if (api.client === FETCH_CLIENT) return FETCH_METHODS.has(api.method);
  return api.method === '' || HTTP_METHODS.has(api.method);
}

/**
 * Recognizes conventional global client names.
 * @param client - Recognized IO client name.
 * @param method - Original API method name.
 * @returns The result of the described check or resolution.
 */
function knownApi(client: string, method: string): IIoApi | null {
  if (SUBPROCESS_APIS.has(client)) return { client: 'child_process', method: client };
  return HTTP_CLIENTS.has(client) || client === FETCH_CLIENT ? { client, method } : null;
}

/**
 * Resolves a static client namespace member.
 * @param source - Source code and lexical scopes.
 * @param callee - Call target to inspect.
 * @returns The result of the described check or resolution.
 */
function memberApi(
  source: Readonly<TSESLint.SourceCode>,
  callee: Readonly<TSESTree.MemberExpression>,
): IIoApi | null {
  if (callee.object.type !== AST_NODE_TYPES.Identifier) return null;
  const api = identifierApi(source, callee.object);
  if (api === null) return null;
  const method = getCalleeName(callee);
  return method === null ? null : { client: api.client, method };
}

/**
 * Recognizes a config-only call when its first argument is a local object.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function objectFirstIndex(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.CallExpression>,
): number {
  const first = getArgument(node, 0);
  return first !== null && resolveLocalValue(source, first).type === AST_NODE_TYPES.ObjectExpression
    ? 0
    : 1;
}

/**
 * Resolves identifiers and static namespace members.
 * @param source - Source code and lexical scopes.
 * @param callee - Call target to inspect.
 * @returns The result of the described check or resolution.
 */
function resolveCalleeApi(
  source: Readonly<TSESLint.SourceCode>,
  callee: Readonly<TSESTree.Expression>,
): IIoApi | null {
  if (callee.type === AST_NODE_TYPES.Identifier) return identifierApi(source, callee);
  if (callee.type !== AST_NODE_TYPES.MemberExpression) return null;
  return memberApi(source, callee);
}

/**
 * Resolves a callee and filters out client factories and unrelated methods.
 * @param source - Source code and lexical scopes.
 * @param callee - Call target to inspect.
 * @returns The result of the described check or resolution.
 */
export function resolveIoApi(
  source: Readonly<TSESLint.SourceCode>,
  callee: Readonly<TSESTree.Expression>,
): IIoApi | null {
  const api = resolveCalleeApi(source, callee);
  return api !== null && isIoMethod(api) ? api : null;
}

/**
 * Handles optional subprocess argv arrays without accepting them as options.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param method - Original API method name.
 * @returns The result of the described check or resolution.
 */
function subprocessOptionsIndex(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.CallExpression>,
  method: string,
): number {
  if (COMMAND_ONLY_APIS.has(method)) return 1;
  const second = getArgument(node, 1);
  if (second === null) return 1;
  return resolveLocalValue(source, second).type === AST_NODE_TYPES.ObjectExpression
    ? 1
    : BODY_OPTIONS_INDEX;
}
