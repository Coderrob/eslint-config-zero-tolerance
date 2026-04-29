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
  hasTrueObjectProperty,
  isDynamicString,
} from './support/security-ast';

const CHILD_PROCESS_MODULES = ['child_process', 'node:child_process'];
const DEFAULT_SHELL_FUNCTIONS = ['exec', 'execSync', 'execaCommand'];
const EXECA_COMMAND_PATH = 'execa.command';
const SPAWN_FUNCTIONS = ['spawn', 'spawnSync'];
const SHELL_PROPERTY = 'shell';

interface INoShellCommandConstructionOptions {
  additionalShellFunctionNames?: readonly string[];
  approvedWrapperNames?: readonly string[];
}

interface IShellCommandState {
  readonly childProcessImports: Map<string, string>;
  readonly childProcessNamespaces: Set<string>;
}

enum NoShellCommandConstructionMessageId {
  ShellCommandConstruction = 'shellCommandConstruction',
}

type NoShellCommandConstructionContext = Readonly<
  TSESLint.RuleContext<
    NoShellCommandConstructionMessageId,
    [INoShellCommandConstructionOptions?]
  >
>;

/**
 * Checks subprocess calls for shell command construction.
 *
 * @param context - ESLint rule execution context.
 * @param state - Import tracking state.
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 */
function checkShellCommandCall(
  context: Readonly<NoShellCommandConstructionContext>,
  state: Readonly<IShellCommandState>,
  options: Readonly<Required<INoShellCommandConstructionOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (isApprovedWrapper(options, node)) {
    return;
  }
  if (isShellStringCall(state, options, node) || isShellEnabledSpawn(state, node)) {
    context.report({ node, messageId: NoShellCommandConstructionMessageId.ShellCommandConstruction });
  }
}

/**
 * Creates listeners for no-shell-command-construction.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoShellCommandConstructionListeners(
  context: Readonly<NoShellCommandConstructionContext>,
): TSESLint.RuleListener {
  const state: IShellCommandState = {
    childProcessImports: new Map(),
    childProcessNamespaces: new Set(),
  };
  const options = normalizeOptions(context.options[0]);
  return {
    ImportDeclaration: trackChildProcessImports.bind(undefined, state),
    CallExpression: checkShellCommandCall.bind(undefined, context, state, options),
  };
}

/**
 * Gets the imported child_process API name for a callee.
 *
 * @param state - Import tracking state.
 * @param callee - Callee expression to inspect.
 * @returns The original child_process API name.
 */
function getChildProcessApiName(
  state: Readonly<IShellCommandState>,
  callee: Readonly<TSESTree.Expression>,
): string | null {
  const calleeName = getCalleeName(callee);
  const memberPath = getMemberPath(callee);
  if (calleeName !== null && state.childProcessImports.has(calleeName)) {
    /* istanbul ignore next */
    return state.childProcessImports.get(calleeName) ?? null;
  }
  return getNamespacedApiName(state, memberPath);
}

/**
 * Gets a namespaced child_process API name.
 *
 * @param state - Import tracking state.
 * @param memberPath - Dotted callee path.
 * @returns The API name when the path uses a tracked namespace.
 */
function getNamespacedApiName(state: Readonly<IShellCommandState>, memberPath: string | null): string | null {
  /* istanbul ignore next */
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
 * Gets a subprocess API name without treating arbitrary member methods as shells.
 *
 * @param state - Import tracking state.
 * @param callee - Callee expression to inspect.
 * @returns Shell API name when statically known.
 */
function getShellApiName(state: Readonly<IShellCommandState>, callee: Readonly<TSESTree.Expression>): string | null {
  const importedName = getChildProcessApiName(state, callee);
  if (importedName !== null) {
    return importedName;
  }
  return callee.type === AST_NODE_TYPES.Identifier ? callee.name : null;
}

/**
 * Returns true when any call argument sets shell to true.
 *
 * @param node - Call expression to inspect.
 * @returns True when a shell true option exists.
 */
function hasShellTrueArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  for (const argument of node.arguments) {
    if (hasTrueObjectProperty(argument, SHELL_PROPERTY)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a call is an approved project wrapper.
 *
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 * @returns True when the call is allowlisted.
 */
function isApprovedWrapper(
  options: Readonly<Required<INoShellCommandConstructionOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  return options.approvedWrapperNames.includes(getCalleeName(node.callee) ?? '');
}

/**
 * Returns true when the first argument is a dynamic string expression.
 *
 * @param node - Call expression to inspect.
 * @returns True when the first argument is dynamic.
 */
function isDynamicFirstArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  if (node.arguments.length === 0) {
    return false;
  }
  const firstArgument = node.arguments[0];
  return firstArgument.type !== AST_NODE_TYPES.SpreadElement && isDynamicString(firstArgument);
}

/**
 * Returns true when a spawn call enables shell mode.
 *
 * @param state - Import tracking state.
 * @param node - Call expression to inspect.
 * @returns True when spawn shell mode is enabled.
 */
function isShellEnabledSpawn(state: Readonly<IShellCommandState>, node: Readonly<TSESTree.CallExpression>): boolean {
  const apiName = getShellApiName(state, node.callee);
  return SPAWN_FUNCTIONS.includes(apiName ?? '') && hasShellTrueArgument(node);
}

/**
 * Returns true when a call is a known shell-string executor.
 *
 * @param options - Normalized rule options.
 * @param apiName - Resolved API name.
 * @param node - Call expression to inspect.
 * @returns True when the call executes a command string.
 */
function isShellExecutor(
  options: Readonly<Required<INoShellCommandConstructionOptions>>,
  apiName: string | null,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const shellNames = [...DEFAULT_SHELL_FUNCTIONS, ...options.additionalShellFunctionNames];
  return shellNames.includes(apiName ?? '') || getMemberPath(node.callee) === EXECA_COMMAND_PATH;
}

/**
 * Returns true when a shell-string execution call is unsafe.
 *
 * @param state - Import tracking state.
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 * @returns True when the call constructs or executes a shell command string.
 */
function isShellStringCall(
  state: Readonly<IShellCommandState>,
  options: Readonly<Required<INoShellCommandConstructionOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  const apiName = getShellApiName(state, node.callee);
  if (isShellExecutor(options, apiName, node)) {
    return true;
  }
  return isSpawnDynamicCommand(apiName, node);
}

/**
 * Returns true when spawn receives a dynamic command string.
 *
 * @param apiName - Resolved API name.
 * @param node - Call expression to inspect.
 * @returns True when the command argument is dynamically constructed.
 */
function isSpawnDynamicCommand(apiName: string | null, node: Readonly<TSESTree.CallExpression>): boolean {
  if (!SPAWN_FUNCTIONS.includes(apiName ?? '')) {
    return false;
  }
  return isDynamicFirstArgument(node);
}

/**
 * Applies default options for the rule.
 *
 * @param options - User supplied options.
 * @returns Normalized rule options.
 */
function normalizeOptions(
  options: INoShellCommandConstructionOptions | undefined,
): Required<INoShellCommandConstructionOptions> {
  if (options === undefined) {
    return { additionalShellFunctionNames: [], approvedWrapperNames: [] };
  }
  return {
    additionalShellFunctionNames: options.additionalShellFunctionNames ?? [],
    /* istanbul ignore next */
    approvedWrapperNames: options.approvedWrapperNames ?? [],
  };
}

/**
 * Tracks child_process imports.
 *
 * @param state - Import tracking state.
 * @param node - Import declaration to inspect.
 */
function trackChildProcessImports(
  state: Readonly<IShellCommandState>,
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
  state: Readonly<IShellCommandState>,
  specifier: Readonly<TSESTree.ImportClause>,
): void {
  if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
    state.childProcessNamespaces.add(specifier.local.name);
  }
  if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
    /* istanbul ignore next */
    state.childProcessImports.set(specifier.local.name, getCalleeName(specifier.imported) ?? '');
  }
}

/**
 * ESLint rule that blocks unsafe shell command construction.
 */
export const noShellCommandConstruction = createRule({
  name: 'no-shell-command-construction',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow shell command construction through subprocess APIs',
    },
    messages: {
      shellCommandConstruction: 'Shell command string execution is not allowed.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          approvedWrapperNames: { type: 'array', items: { type: 'string' } },
          additionalShellFunctionNames: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createNoShellCommandConstructionListeners,
});

export default noShellCommandConstruction;
