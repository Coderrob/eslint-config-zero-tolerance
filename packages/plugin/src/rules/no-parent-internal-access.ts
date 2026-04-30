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
import { getLiteralStringValue as getLiteralStringNodeValue } from '../helpers/ast-helpers';
import { getStringLiteralCallArgument, hasCallCalleeNamePath } from '../helpers/ast/calls';
import { isParentDirectoryImportPath } from '../helpers/import-path-helpers';
import { CALLEE_REQUIRE } from './support/rule-constants';
import { createRule } from './support/rule-factory';

const DEFAULT_PROTECTED_DIRECTORIES = ['src'];
const EMPTY_STRING = '';
const PATH_SEGMENT_SEPARATOR = '/';
const PARENT_PATH_TOKEN = '..';

interface INoParentInternalAccessOptions {
  protectedDirectories?: string[];
}

interface IResolvedNoParentInternalAccessOptions {
  protectedDirectories: Set<string>;
}

type NoParentInternalAccessContext = Readonly<
  TSESLint.RuleContext<'protectedParentImport', RuleOptions>
>;
type RuleOptions = [INoParentInternalAccessOptions];

/**
 * Checks plain require() calls for protected parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Call expression node.
 */
function checkCallExpression(
  context: Readonly<NoParentInternalAccessContext>,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!hasCallCalleeNamePath(node, [CALLEE_REQUIRE])) {
    return;
  }
  const firstArgument = getStringLiteralCallArgument(node, 0);
  if (firstArgument === null) {
    return;
  }
  reportIfProtectedParentImport(context, options, firstArgument, firstArgument.value);
}

/**
 * Checks export-all declarations for protected parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Export-all declaration node.
 */
function checkExportAllDeclaration(
  context: Readonly<NoParentInternalAccessContext>,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
  node: Readonly<TSESTree.ExportAllDeclaration>,
): void {
  reportIfProtectedParentImport(context, options, node.source, node.source.value);
}

/**
 * Checks named re-export declarations for protected parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Export named declaration node.
 */
function checkExportNamedDeclaration(
  context: Readonly<NoParentInternalAccessContext>,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
  node: Readonly<TSESTree.ExportNamedDeclaration>,
): void {
  if (node.source !== null) {
    reportIfProtectedParentImport(context, options, node.source, node.source.value);
  }
}

/**
 * Checks static import declarations for protected parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Import declaration node.
 */
function checkImportDeclaration(
  context: Readonly<NoParentInternalAccessContext>,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
  node: Readonly<TSESTree.ImportDeclaration>,
): void {
  reportIfProtectedParentImport(context, options, node.source, node.source.value);
}

/**
 * Checks dynamic import() expressions for protected parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Import expression node.
 */
function checkImportExpression(
  context: Readonly<NoParentInternalAccessContext>,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
  node: Readonly<TSESTree.ImportExpression>,
): void {
  const importPath = getLiteralStringNodeValue(node.source);
  if (importPath !== null) {
    reportIfProtectedParentImport(context, options, node.source, importPath);
  }
}

/**
 * Checks TypeScript import-equals declarations for protected parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - TS import-equals declaration node.
 */
function checkTsImportEqualsDeclaration(
  context: Readonly<NoParentInternalAccessContext>,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
  node: Readonly<TSESTree.TSImportEqualsDeclaration>,
): void {
  const moduleReference = getExternalModuleReference(node);
  const importPath = moduleReference === null ? null : getLiteralStringNodeValue(moduleReference);
  if (moduleReference !== null && importPath !== null) {
    reportIfProtectedParentImport(context, options, moduleReference, importPath);
  }
}

/**
 * Creates listeners for import-like syntaxes that can reach protected parent directories.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoParentInternalAccessListeners(
  context: Readonly<NoParentInternalAccessContext>,
): TSESLint.RuleListener {
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
 * Returns the first non-parent segment of a relative import path.
 *
 * @param importPath - Relative import path to inspect.
 * @returns The first non-parent segment, or null when none exists.
 */
function getFirstNonParentSegment(importPath: string): string | null {
  for (const segment of importPath.split(PATH_SEGMENT_SEPARATOR)) {
    if (segment !== '' && segment !== PARENT_PATH_TOKEN) {
      return segment;
    }
  }
  return null;
}

/**
 * Builds the protected-directory set from raw configuration input.
 *
 * @param protectedDirectories - Raw configured directory names.
 * @returns Normalized protected-directory names.
 */
function getProtectedDirectories(protectedDirectories: readonly string[] | undefined): Set<string> {
  const configuredDirectories = protectedDirectories ?? DEFAULT_PROTECTED_DIRECTORIES;
  return new Set(configuredDirectories.map(normalizeProtectedDirectoryName).filter(isDirectoryName));
}

/**
 * Returns the protected directory reached by a parent path, or null when none matches.
 *
 * @param importPath - Import or re-export path to evaluate.
 * @param options - Resolved rule options.
 * @returns The matching protected directory name, or null when the path is allowed.
 */
function getProtectedDirectoryFromParentPath(
  importPath: string,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
): string | null {
  if (!isParentDirectoryImportPath(importPath)) {
    return null;
  }
  const firstNonParentSegment = getFirstNonParentSegment(importPath);
  if (firstNonParentSegment === null) {
    return null;
  }
  return options.protectedDirectories.has(firstNonParentSegment) ? firstNonParentSegment : null;
}

/**
 * Returns true when a normalized directory name is usable.
 *
 * @param directoryName - Candidate directory name.
 * @returns True when the directory name is non-null.
 */
function isDirectoryName(directoryName: string | null): directoryName is string {
  return directoryName !== null;
}

/**
 * Normalizes a configured protected-directory name.
 *
 * @param directoryName - Raw directory name from rule options.
 * @returns Trimmed directory name, or null when it is empty.
 */
function normalizeProtectedDirectoryName(directoryName: string): string | null {
  const normalizedDirectoryName = directoryName.trim();
  return normalizedDirectoryName === EMPTY_STRING ? null : normalizedDirectoryName;
}

/**
 * Reports a violation when the provided path reaches into a protected parent directory.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - AST node that owns the source path.
 * @param importPath - Import or re-export path to validate.
 */
function reportIfProtectedParentImport(
  context: Readonly<NoParentInternalAccessContext>,
  options: Readonly<IResolvedNoParentInternalAccessOptions>,
  node: Readonly<TSESTree.Node>,
  importPath: string,
): void {
  const directory = getProtectedDirectoryFromParentPath(importPath, options);
  if (directory !== null) {
    context.report({
      node,
      messageId: 'protectedParentImport',
      data: { directory, importPath },
    });
  }
}

/**
 * Resolves protected-directory options with defaults applied.
 *
 * @param options - Raw rule options.
 * @returns Resolved protected-directory option set.
 */
function resolveOptions(options: Readonly<RuleOptions>): IResolvedNoParentInternalAccessOptions {
  const [raw = {}] = options;
  return {
    protectedDirectories: getProtectedDirectories(raw.protectedDirectories),
  };
}

/**
 * ESLint rule that disallows parent-relative imports and re-exports into protected internal directories.
 */
export const noParentInternalAccess = createRule({
  name: 'no-parent-internal-access',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow parent-relative access into protected internal directories such as src',
    },
    messages: {
      protectedParentImport:
        'Path "{{importPath}}" reaches into protected parent directory "{{directory}}"; depend on that module through a public entrypoint instead',
    },
    schema: [
      {
        type: 'object',
        properties: {
          protectedDirectories: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ protectedDirectories: DEFAULT_PROTECTED_DIRECTORIES }],
  create: createNoParentInternalAccessListeners,
});

export default noParentInternalAccess;
