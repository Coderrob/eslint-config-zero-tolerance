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
import { createRule } from './support/rule-factory';

type RequireNodeProtocolContext = Readonly<TSESLint.RuleContext<'requireNodeProtocol', []>>;

const NODE_PROTOCOL_PREFIX = 'node:';

const NODE_BUILTINS: ReadonlySet<string> = new Set([
  'assert',
  'assert/strict',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'dns/promises',
  'domain',
  'events',
  'fs',
  'fs/promises',
  'http',
  'http2',
  'https',
  'inspector',
  'inspector/promises',
  'module',
  'net',
  'os',
  'path',
  'path/posix',
  'path/win32',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'readline/promises',
  'repl',
  'stream',
  'stream/consumers',
  'stream/promises',
  'stream/web',
  'string_decoder',
  'test',
  'timers',
  'timers/promises',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'util/types',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
]);

/**
 * Checks an import or re-export source literal for bare Node.js built-in usage.
 *
 * @param context - ESLint rule execution context.
 * @param source - The source node of the import/export declaration, if present.
 */
function checkSource(
  context: Readonly<RequireNodeProtocolContext>,
  source: TSESTree.StringLiteral | null,
): void {
  if (source === null) {
    return;
  }
  if (isBareNodeBuiltin(source.value)) {
    reportBareBuiltin(context, source);
  }
}

/**
 * Creates listeners that enforce the `node:` protocol prefix on Node.js built-in imports.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createRequireNodeProtocolListeners(
  context: Readonly<RequireNodeProtocolContext>,
): TSESLint.RuleListener {
  return {
    ImportDeclaration: handleImportDeclaration.bind(undefined, context),
    ExportNamedDeclaration: handleExportNamedDeclaration.bind(undefined, context),
    ExportAllDeclaration: handleExportAllDeclaration.bind(undefined, context),
  };
}

/**
 * Applies the `node:` prefix fix to a string literal import source.
 *
 * @param sourceNode - The string literal AST node for the import source.
 * @param fixer - ESLint fixer utility.
 * @returns Rule fix operation.
 */
function fixNodeProtocol(
  sourceNode: Readonly<TSESTree.StringLiteral>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const quote = sourceNode.raw[0];
  return fixer.replaceText(
    sourceNode,
    `${quote}${NODE_PROTOCOL_PREFIX}${sourceNode.value}${quote}`,
  );
}

/**
 * Handles ExportAllDeclaration nodes to check for bare Node.js built-in usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - The export-all declaration node.
 */
function handleExportAllDeclaration(
  context: Readonly<RequireNodeProtocolContext>,
  node: Readonly<TSESTree.ExportAllDeclaration>,
): void {
  checkSource(context, node.source);
}

/**
 * Handles ExportNamedDeclaration nodes to check for bare Node.js built-in usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - The named export declaration node.
 */
function handleExportNamedDeclaration(
  context: Readonly<RequireNodeProtocolContext>,
  node: Readonly<TSESTree.ExportNamedDeclaration>,
): void {
  checkSource(context, node.source);
}

/**
 * Handles ImportDeclaration nodes to check for bare Node.js built-in usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - The import declaration node.
 */
function handleImportDeclaration(
  context: Readonly<RequireNodeProtocolContext>,
  node: Readonly<TSESTree.ImportDeclaration>,
): void {
  checkSource(context, node.source);
}

/**
 * Checks whether a module specifier refers to a Node.js built-in without the `node:` prefix.
 *
 * @param source - The import source string value.
 * @returns True when the source is a bare Node.js built-in missing the protocol prefix.
 */
function isBareNodeBuiltin(source: string): boolean {
  return NODE_BUILTINS.has(source);
}

/**
 * Reports a bare Node.js built-in import and provides an autofix.
 *
 * @param context - ESLint rule execution context.
 * @param sourceNode - The string literal AST node for the import source.
 */
function reportBareBuiltin(
  context: Readonly<RequireNodeProtocolContext>,
  sourceNode: Readonly<TSESTree.StringLiteral>,
): void {
  context.report({
    node: sourceNode,
    messageId: 'requireNodeProtocol',
    data: { module: sourceNode.value },
    fix: fixNodeProtocol.bind(undefined, sourceNode),
  });
}

/**
 * ESLint rule that requires Node.js built-in module imports to use the `node:` protocol prefix.
 */
export const requireNodeProtocol = createRule({
  name: 'require-node-protocol',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Require Node.js built-in module imports to use the `node:` protocol prefix',
    },
    messages: {
      requireNodeProtocol:
        'Import of Node.js built-in module "{{module}}" must use the "node:{{module}}" protocol prefix',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireNodeProtocolListeners,
});

export default requireNodeProtocol;
