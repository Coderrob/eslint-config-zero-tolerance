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

import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isParentDirectoryImportPath } from '../import-path-helpers';
import { CALLEE_REQUIRE } from '../rule-constants';
import { createRule } from '../rule-factory';

const PARENT_PATH_TOKEN = '..';

type NoParentImportsContext = Readonly<TSESLint.RuleContext<'noParentImport', []>>;

/**
 * Checks require calls for parent-directory import paths.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(context: NoParentImportsContext, node: TSESTree.CallExpression): void {
  if (!isRequireIdentifier(node.callee)) {
    return;
  }
  const firstArgument = getFirstArgument(node);
  if (firstArgument === null) {
    return;
  }
  const importPath = getStringLiteralArgumentValue(firstArgument);
  if (importPath !== null) {
    reportIfParentImport(context, firstArgument, importPath);
  }
}

/**
 * Checks static import declarations for parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param node - Import declaration node.
 */
function checkImportDeclaration(
  context: NoParentImportsContext,
  node: TSESTree.ImportDeclaration,
): void {
  reportIfParentImport(context, node.source, node.source.value);
}

/**
 * Checks dynamic import expressions for parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param node - Import expression node.
 */
function checkImportExpression(
  context: NoParentImportsContext,
  node: TSESTree.ImportExpression,
): void {
  const importPath = getLiteralStringValue(node.source);
  if (importPath !== null) {
    reportIfParentImport(context, node.source, importPath);
  }
}

/**
 * Checks TypeScript import-equals declarations for parent-directory paths.
 *
 * @param context - ESLint rule execution context.
 * @param node - TS import-equals declaration node.
 */
function checkTsImportEqualsDeclaration(
  context: NoParentImportsContext,
  node: TSESTree.TSImportEqualsDeclaration,
): void {
  const moduleReference = getExternalModuleReference(node);
  const importPath = moduleReference === null ? null : getLiteralStringValue(moduleReference);
  if (moduleReference !== null && importPath !== null) {
    reportIfParentImport(context, moduleReference, importPath);
  }
}

/**
 * Creates listeners for all import syntaxes that can traverse parent directories.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoParentImportsListeners(context: NoParentImportsContext): TSESLint.RuleListener {
  return {
    CallExpression: checkCallExpression.bind(undefined, context),
    ImportDeclaration: checkImportDeclaration.bind(undefined, context),
    ImportExpression: checkImportExpression.bind(undefined, context),
    TSImportEqualsDeclaration: checkTsImportEqualsDeclaration.bind(undefined, context),
  };
}

/**
 * Gets the referenced module expression from a TS import-equals declaration.
 *
 * @param node - TS import-equals declaration node.
 * @returns String-literal expression when it targets an external module.
 */
function getExternalModuleReference(
  node: TSESTree.TSImportEqualsDeclaration,
): TSESTree.Expression | null {
  if (node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference) {
    return null;
  }
  return node.moduleReference.expression;
}

/**
 * Safely extracts the first call argument.
 *
 * @param node - Call expression node.
 * @returns The first argument, or null when absent.
 */
function getFirstArgument(node: TSESTree.CallExpression): TSESTree.CallExpressionArgument | null {
  const firstArgument = node.arguments[0];
  return firstArgument === undefined ? null : firstArgument;
}

/**
 * Extracts a string literal value from a literal node.
 *
 * @param node - Potential literal node.
 * @returns The literal string value, or null.
 */
function getLiteralStringValue(node: TSESTree.Node): string | null {
  if (node.type !== AST_NODE_TYPES.Literal) {
    return null;
  }
  return typeof node.value === 'string' ? node.value : null;
}

/**
 * Extracts a string literal value from a call expression argument.
 *
 * @param argument - Call expression argument node.
 * @returns The string literal value, or null when not a string literal.
 */
function getStringLiteralArgumentValue(argument: TSESTree.CallExpressionArgument): string | null {
  return getLiteralStringValue(argument);
}

/**
 * Returns true when a callee node is the global `require` identifier.
 *
 * @param callee - Call expression callee node.
 * @returns True when the callee is `require`.
 */
function isRequireIdentifier(callee: TSESTree.Node): boolean {
  return callee.type === AST_NODE_TYPES.Identifier && callee.name === CALLEE_REQUIRE;
}

/**
 * Reports a violation when the provided source path traverses to a parent directory.
 *
 * @param context - ESLint rule execution context.
 * @param node - The AST node to report.
 * @param importPath - The module path to validate.
 */
function reportIfParentImport(
  context: NoParentImportsContext,
  node: TSESTree.Node,
  importPath: string,
): void {
  if (isParentDirectoryImportPath(importPath)) {
    context.report({
      node,
      messageId: 'noParentImport',
      data: { importPath },
    });
  }
}

/**
 * ESLint rule that disallows parent-directory traversal in all import patterns.
 */
export const noParentImports = createRule({
  name: 'no-parent-imports',
  meta: {
    type: 'suggestion',
    docs: {
      description: `Disallow parent-directory imports (\`${PARENT_PATH_TOKEN}\` and \`${PARENT_PATH_TOKEN}/*\`) in import declarations, import expressions, require calls, and import-equals declarations`,
    },
    messages: {
      noParentImport:
        'Parent-directory import "{{importPath}}" is not allowed; use absolute or project-rooted import paths instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoParentImportsListeners,
});

export default noParentImports;
