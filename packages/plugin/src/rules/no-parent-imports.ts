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

const PARENT_PATH_TOKEN = '..';

type NoParentImportsContext = Readonly<TSESLint.RuleContext<'noParentImport', []>>;

/**
 * Checks require calls for parent-directory import paths.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression node.
 */
function checkCallExpression(context: NoParentImportsContext, node: TSESTree.CallExpression): void {
  if (!hasCallCalleeNamePath(node, [CALLEE_REQUIRE])) {
    return;
  }
  const firstArgument = getStringLiteralCallArgument(node, 0);
  if (firstArgument === null) {
    return;
  }
  reportIfParentImport(context, firstArgument, firstArgument.value);
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
  const importPath = getLiteralStringNodeValue(node.source);
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
  const importPath = moduleReference === null ? null : getLiteralStringNodeValue(moduleReference);
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
