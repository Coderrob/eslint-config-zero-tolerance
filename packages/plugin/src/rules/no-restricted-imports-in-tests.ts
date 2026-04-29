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
import { getLiteralStringValue } from '../helpers/ast-helpers';
import { getStringLiteralCallArgument, hasCallCalleeNamePath } from '../helpers/ast/calls';
import { CALLEE_REQUIRE } from './support/rule-constants';
import { createRule } from './support/rule-factory';

const DEFAULT_RESTRICTED_MODULES = [
  'axios',
  'child_process',
  'dgram',
  'dns',
  'fs',
  'got',
  'http',
  'http2',
  'https',
  'net',
  'node-fetch',
  'tls',
  'undici',
  'worker_threads',
];
const EMPTY_STRING = '';
const NODE_PROTOCOL_PREFIX = 'node:';
const PATH_SEGMENT_SEPARATOR = '/';
const SCOPED_PACKAGE_SEGMENT_COUNT = 2;
const SCOPE_PREFIX = '@';
const WILDCARD_SUFFIX = '/*';

interface INoRestrictedImportsInTestsOptions {
  modules?: string[];
}

interface IResolvedNoRestrictedImportsInTestsOptions {
  modules: Set<string>;
}

type NoRestrictedImportsInTestsContext = Readonly<
  TSESLint.RuleContext<'noRestrictedImportsInTests', RuleOptions>
>;
type RuleOptions = [INoRestrictedImportsInTestsOptions];

/**
 * Adds a normalized restricted module root when configuration provides one.
 *
 * @param modules - Accumulator set of restricted module roots.
 * @param moduleName - Raw configured module name.
 */
function addRestrictedModule(modules: Readonly<Set<string>>, moduleName: string): void {
  const normalizedModuleName = normalizeConfiguredModuleName(moduleName);
  if (normalizedModuleName !== null) {
    modules.add(normalizedModuleName);
  }
}

/**
 * Checks plain require() calls for restricted test imports.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: Readonly<NoRestrictedImportsInTestsContext>,
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!hasCallCalleeNamePath(node, [CALLEE_REQUIRE])) {
    return;
  }
  const firstArgument = getStringLiteralCallArgument(node, 0);
  if (firstArgument !== null) {
    reportIfRestrictedImport(context, options, firstArgument, firstArgument.value);
  }
}

/**
 * Checks export-all declarations for restricted test imports.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Export-all declaration node.
 */
function checkExportAllDeclaration(
  context: Readonly<NoRestrictedImportsInTestsContext>,
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  node: Readonly<TSESTree.ExportAllDeclaration>,
): void {
  reportIfRestrictedImport(context, options, node.source, node.source.value);
}

/**
 * Checks named re-export declarations for restricted test imports.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Export named declaration node.
 */
function checkExportNamedDeclaration(
  context: Readonly<NoRestrictedImportsInTestsContext>,
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  node: Readonly<TSESTree.ExportNamedDeclaration>,
): void {
  if (node.source !== null) {
    reportIfRestrictedImport(context, options, node.source, node.source.value);
  }
}

/**
 * Checks static import declarations for restricted test imports.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Import declaration node.
 */
function checkImportDeclaration(
  context: Readonly<NoRestrictedImportsInTestsContext>,
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  node: Readonly<TSESTree.ImportDeclaration>,
): void {
  reportIfRestrictedImport(context, options, node.source, node.source.value);
}

/**
 * Checks dynamic import() expressions for restricted test imports.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Import expression node.
 */
function checkImportExpression(
  context: Readonly<NoRestrictedImportsInTestsContext>,
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  node: Readonly<TSESTree.ImportExpression>,
): void {
  const importPath = getLiteralStringValue(node.source);
  if (importPath !== null) {
    reportIfRestrictedImport(context, options, node.source, importPath);
  }
}

/**
 * Checks TypeScript import-equals declarations for restricted test imports.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - TS import-equals declaration node.
 */
function checkTsImportEqualsDeclaration(
  context: Readonly<NoRestrictedImportsInTestsContext>,
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  node: Readonly<TSESTree.TSImportEqualsDeclaration>,
): void {
  const moduleReference = getExternalModuleReference(node);
  const importPath = moduleReference === null ? null : getLiteralStringValue(moduleReference);
  if (moduleReference !== null && importPath !== null) {
    reportIfRestrictedImport(context, options, moduleReference, importPath);
  }
}

/**
 * Creates listeners for restricted import syntaxes in test files only.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoRestrictedImportsInTestsListeners(
  context: Readonly<NoRestrictedImportsInTestsContext>,
): TSESLint.RuleListener {
  if (!isTestFile(context.filename)) {
    return {};
  }

  const options = resolveOptions(context.options);
  return {
    CallExpression: checkCallExpression.bind(undefined, context, options),
    ExportAllDeclaration: checkExportAllDeclaration.bind(undefined, context, options),
    ExportNamedDeclaration: checkExportNamedDeclaration.bind(undefined, context, options),
    ImportDeclaration: checkImportDeclaration.bind(undefined, context, options),
    ImportExpression: checkImportExpression.bind(undefined, context, options),
    TSImportEqualsDeclaration: checkTsImportEqualsDeclaration.bind(undefined, context, options),
  };
}

/**
 * Gets the referenced module expression from a TS import-equals declaration.
 *
 * @param node - TS import-equals declaration node.
 * @returns String-literal expression when it targets an external module.
 */
function getExternalModuleReference(
  node: Readonly<TSESTree.TSImportEqualsDeclaration>,
): TSESTree.Expression | null {
  if (node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference) {
    return null;
  }
  return node.moduleReference.expression;
}

/**
 * Returns the package or Node module root for an import path.
 *
 * @param moduleName - Normalized import path.
 * @returns Module root used for restriction matching.
 */
function getImportRoot(moduleName: string): string {
  const segments = moduleName.split(PATH_SEGMENT_SEPARATOR);
  if (moduleName.startsWith(SCOPE_PREFIX) && segments.length >= SCOPED_PACKAGE_SEGMENT_COUNT) {
    return segments.slice(0, SCOPED_PACKAGE_SEGMENT_COUNT).join(PATH_SEGMENT_SEPARATOR);
  }
  return segments[0] ?? moduleName;
}

/**
 * Returns the restricted module matched by an import path, or null.
 *
 * @param options - Resolved rule options.
 * @param importPath - Import path to inspect.
 * @returns Matched restricted module name, or null when allowed.
 */
function getRestrictedImportName(
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  importPath: string,
): string | null {
  const moduleName = normalizeImportedModulePath(importPath);
  const importRoot = getImportRoot(moduleName);
  return options.modules.has(importRoot) ? importRoot : null;
}

/**
 * Normalizes configured module names into import roots.
 *
 * @param moduleName - Raw configured module name.
 * @returns Normalized module root, or null when empty.
 */
function normalizeConfiguredModuleName(moduleName: string): string | null {
  let normalizedModuleName = normalizeModuleName(moduleName);
  if (normalizedModuleName.endsWith(WILDCARD_SUFFIX)) {
    normalizedModuleName = normalizedModuleName.slice(0, -WILDCARD_SUFFIX.length);
  }
  return normalizedModuleName === EMPTY_STRING ? null : getImportRoot(normalizedModuleName);
}

/**
 * Normalizes an import path before matching.
 *
 * @param importPath - Raw import path.
 * @returns Normalized import path.
 */
function normalizeImportedModulePath(importPath: string): string {
  return normalizeModuleName(importPath);
}

/**
 * Normalizes module specifiers by trimming, lowercasing, and removing node:.
 *
 * @param moduleName - Raw module specifier.
 * @returns Normalized module specifier.
 */
function normalizeModuleName(moduleName: string): string {
  const trimmedModuleName = moduleName.trim().toLowerCase();
  if (trimmedModuleName.startsWith(NODE_PROTOCOL_PREFIX)) {
    return trimmedModuleName.slice(NODE_PROTOCOL_PREFIX.length);
  }
  return trimmedModuleName;
}

/**
 * Returns the configured module names or default restrictions.
 *
 * @param options - Raw rule options.
 * @returns Raw configured module names with defaults applied.
 */
function readConfiguredModules(options: Readonly<RuleOptions>): readonly string[] {
  const [raw = {}] = options;
  return raw.modules ?? DEFAULT_RESTRICTED_MODULES;
}

/**
 * Reports a violation when the import path matches a restricted test module.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - AST node that owns the source path.
 * @param importPath - Import path to validate.
 */
function reportIfRestrictedImport(
  context: Readonly<NoRestrictedImportsInTestsContext>,
  options: Readonly<IResolvedNoRestrictedImportsInTestsOptions>,
  node: Readonly<TSESTree.Node>,
  importPath: string,
): void {
  const moduleName = getRestrictedImportName(options, importPath);
  if (moduleName !== null) {
    context.report({
      node,
      messageId: 'noRestrictedImportsInTests',
      data: { importPath, moduleName },
    });
  }
}

/**
 * Resolves restricted module options with defaults applied.
 *
 * @param options - Raw rule options.
 * @returns Resolved restricted module option set.
 */
function resolveOptions(options: Readonly<RuleOptions>): IResolvedNoRestrictedImportsInTestsOptions {
  const modules = new Set<string>();
  for (const moduleName of readConfiguredModules(options)) {
    addRestrictedModule(modules, moduleName);
  }
  return { modules };
}

/** ESLint rule that disallows restricted imports in test files. */
export const noRestrictedImportsInTests = createRule({
  name: 'no-restricted-imports-in-tests',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow restricted dependency imports in test files',
    },
    messages: {
      noRestrictedImportsInTests:
        'Avoid importing "{{importPath}}" in tests; "{{moduleName}}" is a restricted test dependency.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          modules: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ modules: DEFAULT_RESTRICTED_MODULES }],
  create: createNoRestrictedImportsInTestsListeners,
});

export default noRestrictedImportsInTests;
