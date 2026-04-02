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
import { isIdentifierNode } from '../helpers/ast-guards';
import { getIdentifierName, getLiteralStringValue } from '../helpers/ast-helpers';
import { isParentDirectoryImportPath, isBarrelFile } from '../helpers/import-path-helpers';
import { createRule } from './support/rule-factory';

type NoReExportContext = Readonly<TSESLint.RuleContext<'noReExport', []>>;
type ImportedBindingNames = Set<string>;

/**
 * Returns true when one export specifier exposes a binding imported from a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param specifier - Export specifier to inspect.
 * @returns True when the exported local binding came from a parent import.
 */
function checkExportAllDeclaration(
  context: NoReExportContext,
  node: TSESTree.ExportAllDeclaration,
): void {
  reportIfParentReExport(context, node, node.source.value);
}

/**
 * Checks default exports for pass-through exports of parent imports.
 *
 * @param context - ESLint rule execution context.
 * @param importedBindings - Precomputed imported binding names from parent paths.
 * @param node - Export default declaration node.
 */
function checkExportDefaultDeclaration(
  context: NoReExportContext,
  importedBindings: ImportedBindingNames,
  node: TSESTree.ExportDefaultDeclaration,
): void {
  if (isIdentifierNode(node.declaration) && importedBindings.has(node.declaration.name)) {
    reportIndirectParentReExport(context, node);
  }
}

/**
 * Checks named export declarations for re-exports from parent modules.
 *
 * @param context - ESLint rule execution context.
 * @param importedBindings - Precomputed imported binding names from parent paths.
 * @param node - Export named declaration node.
 */
function checkExportNamedDeclaration(
  context: NoReExportContext,
  importedBindings: ImportedBindingNames,
  node: TSESTree.ExportNamedDeclaration,
): void {
  if (node.source !== null) {
    reportIfParentReExport(context, node, node.source.value);
    return;
  }
  if (hasExportedParentImportBinding(importedBindings, node.specifiers)) {
    reportIndirectParentReExport(context, node);
  }
}

/**
 * Checks TypeScript export assignments for pass-through exports of parent imports.
 *
 * @param context - ESLint rule execution context.
 * @param importedBindings - Precomputed imported binding names from parent paths.
 * @param node - TS export assignment node.
 */
function checkTsExportAssignment(
  context: NoReExportContext,
  importedBindings: ImportedBindingNames,
  node: TSESTree.TSExportAssignment,
): void {
  if (isIdentifierNode(node.expression) && importedBindings.has(node.expression.name)) {
    reportIndirectParentReExport(context, node);
  }
}

/**
 * Adds imported local binding names when an import declaration targets a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param node - Import declaration node.
 */
function collectParentImportDeclarationBindings(
  importedBindings: ImportedBindingNames,
  node: TSESTree.ImportDeclaration,
): void {
  if (!isParentDirectoryImportPath(node.source.value)) {
    return;
  }
  for (const specifier of node.specifiers) {
    importedBindings.add(specifier.local.name);
  }
}

/**
 * Adds imported local binding names when an import-equals declaration targets a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param node - TS import-equals declaration node.
 */
function collectParentImportEqualsBindings(
  importedBindings: ImportedBindingNames,
  node: TSESTree.TSImportEqualsDeclaration,
): void {
  const importPath = getImportEqualsModulePath(node);
  if (importPath === null || !isParentDirectoryImportPath(importPath)) {
    return;
  }
  importedBindings.add(node.id.name);
}

/**
 * Builds listeners for non-barrel files enforced by no-re-export.
 *
 * @param context - ESLint rule execution context.
 * @param importedBindings - Precomputed imported binding names from parent paths.
 * @returns Rule listeners.
 */
function createNonBarrelNoReExportListeners(
  context: NoReExportContext,
  importedBindings: ImportedBindingNames,
): TSESLint.RuleListener {
  return {
    ExportAllDeclaration: checkExportAllDeclaration.bind(undefined, context),
    ExportDefaultDeclaration: checkExportDefaultDeclaration.bind(
      undefined,
      context,
      importedBindings,
    ),
    ExportNamedDeclaration: checkExportNamedDeclaration.bind(undefined, context, importedBindings),
    TSExportAssignment: checkTsExportAssignment.bind(undefined, context, importedBindings),
  };
}

/**
 * Creates listeners for no-re-export rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoReExportListeners(context: NoReExportContext): TSESLint.RuleListener {
  if (isBarrelFile(context.filename)) {
    return {};
  }
  const importedBindings = getImportedBindingsFromParentPaths(context.sourceCode.ast);
  return createNonBarrelNoReExportListeners(context, importedBindings);
}

/**
 * Builds the set of local bindings imported from parent-directory paths anywhere in the module.
 *
 * @param program - Program node to inspect.
 * @returns Imported local binding names sourced from parent paths.
 */
function getImportedBindingsFromParentPaths(program: TSESTree.Program): ImportedBindingNames {
  const importedBindings: ImportedBindingNames = new Set<string>();
  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
      collectParentImportDeclarationBindings(importedBindings, statement);
      continue;
    }
    if (statement.type === AST_NODE_TYPES.TSImportEqualsDeclaration) {
      collectParentImportEqualsBindings(importedBindings, statement);
    }
  }
  return importedBindings;
}

/**
 * Gets the referenced module path from a TS import-equals declaration.
 *
 * @param node - TS import-equals declaration node.
 * @returns Import path when the declaration targets an external module.
 */
function getImportEqualsModulePath(node: TSESTree.TSImportEqualsDeclaration): string | null {
  if (node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference) {
    return null;
  }
  return getLiteralStringValue(node.moduleReference.expression);
}

/**
 * Returns true when an export specifier list exposes a binding imported from a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param specifiers - Export specifiers to inspect.
 * @returns True when any exported binding was imported from a parent path.
 */
function hasExportedParentImportBinding(
  importedBindings: ImportedBindingNames,
  specifiers: readonly TSESTree.ExportSpecifier[],
): boolean {
  return specifiers.some(isParentImportExportSpecifier.bind(undefined, importedBindings));
}

/**
 * Returns true when one export specifier exposes a binding imported from a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param specifier - Export specifier to inspect.
 * @returns True when the exported local binding came from a parent import.
 */
function isParentImportExportSpecifier(
  importedBindings: ImportedBindingNames,
  specifier: TSESTree.ExportSpecifier,
): boolean {
  const localName = getIdentifierName(specifier.local);
  return localName !== null && importedBindings.has(localName);
}

/**
 * Reports when an export source traverses to a parent directory or when a parent import is
 * passed through an export in a non-barrel file.
 *
 * @param context - ESLint rule execution context.
 * @param node - Export node that owns the source value.
 * @param importPath - Source value to validate.
 */
function reportIfParentReExport(
  context: NoReExportContext,
  node: TSESTree.ExportNamedDeclaration | TSESTree.ExportAllDeclaration,
  importPath: string,
): void {
  if (isParentDirectoryImportPath(importPath)) {
    context.report({
      node,
      messageId: 'noReExport',
    });
  }
}

/**
 * Reports when a non-barrel file exports a binding imported from a parent path.
 *
 * @param context - ESLint rule execution context.
 * @param node - Export node that exposes the imported parent binding.
 */
function reportIndirectParentReExport(
  context: NoReExportContext,
  node:
    | TSESTree.ExportDefaultDeclaration
    | TSESTree.ExportNamedDeclaration
    | TSESTree.TSExportAssignment,
): void {
  context.report({
    node,
    messageId: 'noReExport',
  });
}

/**
 * ESLint rule that disallows re-export statements from parent or ancestor modules, including
 * indirect pass-through exports of parent imports.
 */
export const noReExport = createRule({
  name: 'no-re-export',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow direct or indirect re-export statements from parent or ancestor modules; barrel files (index.*) are exempt from this restriction',
    },
    messages: {
      noReExport:
        'Re-export statements from parent or ancestor modules are not allowed in non-barrel files, including pass-through exports of parent imports',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoReExportListeners,
});

export default noReExport;
