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

const TOKEN_COMMA = ',';

type NoReExportContext = Readonly<TSESLint.RuleContext<'noReExport', []>>;
type ImportedBindingNames = Set<string>;
type DirectExportNames = Set<string>;
type DirectNamedExportDeclaration =
  | TSESTree.ClassDeclaration
  | TSESTree.FunctionDeclaration
  | TSESTree.TSInterfaceDeclaration
  | TSESTree.TSTypeAliasDeclaration;

/**
 * Returns true when one export specifier exposes a binding imported from a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param specifier - Export specifier to inspect.
 * @returns True when the exported local binding came from a parent import.
 */
function checkExportAllDeclaration(
  context: Readonly<NoReExportContext>,
  node: Readonly<TSESTree.ExportAllDeclaration>,
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
  context: Readonly<NoReExportContext>,
  importedBindings: Readonly<ImportedBindingNames>,
  node: Readonly<TSESTree.ExportDefaultDeclaration>,
): void {
  if (isIdentifierNode(node.declaration) && importedBindings.has(node.declaration.name)) {
    reportIndirectParentReExport(context, new Set<string>(), node);
  }
}

/**
 * Checks named export declarations for re-exports from parent modules.
 *
 * @param context - ESLint rule execution context.
 * @param importedBindings - Precomputed imported binding names from parent paths.
 * @param directExportNames - Direct exported declaration names.
 * @param node - Export named declaration node.
 */
function checkExportNamedDeclaration(
  context: Readonly<NoReExportContext>,
  importedBindings: Readonly<ImportedBindingNames>,
  directExportNames: Readonly<DirectExportNames>,
  node: Readonly<TSESTree.ExportNamedDeclaration>,
): void {
  if (node.source !== null) {
    reportIfParentReExport(context, node, node.source.value);
    return;
  }
  for (const specifier of node.specifiers) {
    if (isParentImportExportSpecifier(importedBindings, specifier)) {
      reportIndirectParentReExport(context, directExportNames, node, specifier);
    }
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
  context: Readonly<NoReExportContext>,
  importedBindings: Readonly<ImportedBindingNames>,
  node: Readonly<TSESTree.TSExportAssignment>,
): void {
  if (isIdentifierNode(node.expression) && importedBindings.has(node.expression.name)) {
    reportIndirectParentReExport(context, new Set<string>(), node);
  }
}

/**
 * Adds direct export names from one program statement.
 *
 * @param directExportNames - Mutable direct export name collection.
 * @param statement - Program statement to inspect.
 */
function collectDirectExportNames(
  directExportNames: Readonly<DirectExportNames>,
  statement: Readonly<TSESTree.ProgramStatement>,
): void {
  if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration || statement.declaration === null) {
    return;
  }
  const declarationName = getDeclarationExportName(statement.declaration);
  if (declarationName !== null) {
    directExportNames.add(declarationName);
  }
}

/**
 * Adds imported local binding names when an import declaration targets a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param node - Import declaration node.
 */
function collectParentImportDeclarationBindings(
  importedBindings: Readonly<ImportedBindingNames>,
  node: Readonly<TSESTree.ImportDeclaration>,
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
  importedBindings: Readonly<ImportedBindingNames>,
  node: Readonly<TSESTree.TSImportEqualsDeclaration>,
): void {
  const importPath = getImportEqualsModulePath(node);
  if (importPath === null || !isParentDirectoryImportPath(importPath)) {
    return;
  }
  importedBindings.add(node.id.name);
}

/**
 * Creates a fix for redundant named pass-through exports.
 *
 * @param context - ESLint rule execution context.
 * @param directExportNames - Direct exported declaration names.
 * @param node - Export node that exposes the imported parent binding.
 * @param specifier - Named export specifier when available.
 * @returns Fix callback, or null when not safely fixable.
 */
function createIndirectParentReExportFix(
  context: Readonly<NoReExportContext>,
  directExportNames: Readonly<DirectExportNames>,
  node:
    | TSESTree.ExportDefaultDeclaration
    | TSESTree.ExportNamedDeclaration
    | TSESTree.TSExportAssignment,
  specifier?: Readonly<TSESTree.ExportSpecifier>,
): TSESLint.ReportFixFunction | null {
  if (specifier === undefined || !isFixableNamedReExport(directExportNames, node, specifier)) {
    return null;
  }
  return removeExportSpecifier.bind(undefined, context.sourceCode, node, specifier);
}

/**
 * Builds listeners for non-barrel files enforced by no-re-export.
 *
 * @param context - ESLint rule execution context.
 * @param importedBindings - Precomputed imported binding names from parent paths.
 * @param directExportNames - Direct exported declaration names.
 * @returns Rule listeners.
 */
function createNonBarrelNoReExportListeners(
  context: Readonly<NoReExportContext>,
  importedBindings: Readonly<ImportedBindingNames>,
  directExportNames: Readonly<DirectExportNames>,
): TSESLint.RuleListener {
  return {
    ExportAllDeclaration: checkExportAllDeclaration.bind(undefined, context),
    ExportDefaultDeclaration: checkExportDefaultDeclaration.bind(undefined, context, importedBindings),
    ExportNamedDeclaration: checkExportNamedDeclaration.bind(undefined, context, importedBindings, directExportNames),
    TSExportAssignment: checkTsExportAssignment.bind(undefined, context, importedBindings),
  };
}

/**
 * Creates listeners for no-re-export rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoReExportListeners(context: Readonly<NoReExportContext>): TSESLint.RuleListener {
  if (isBarrelFile(context.filename)) {
    return {};
  }
  const importedBindings = getImportedBindingsFromParentPaths(context.sourceCode.ast);
  const directExportNames = getDirectExportNames(context.sourceCode.ast);
  return createNonBarrelNoReExportListeners(context, importedBindings, directExportNames);
}

/**
 * Returns a directly exported declaration name.
 *
 * @param declaration - Exported declaration.
 * @returns Export name, or null when unavailable.
 */
function getDeclarationExportName(declaration: Readonly<TSESTree.Node>): string | null {
  if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
    return getVariableDeclarationExportName(declaration);
  }
  return getNamedDirectExportName(declaration);
}

/**
 * Builds the set of directly exported declaration names.
 *
 * @param program - Program node to inspect.
 * @returns Direct export names.
 */
function getDirectExportNames(program: Readonly<TSESTree.Program>): DirectExportNames {
  const directExportNames: DirectExportNames = new Set<string>();
  for (const statement of program.body) {
    collectDirectExportNames(directExportNames, statement);
  }
  return directExportNames;
}

/**
 * Builds the set of local bindings imported from parent-directory paths anywhere in the module.
 *
 * @param program - Program node to inspect.
 * @returns Imported local binding names sourced from parent paths.
 */
function getImportedBindingsFromParentPaths(program: Readonly<TSESTree.Program>): ImportedBindingNames {
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
function getImportEqualsModulePath(node: Readonly<TSESTree.TSImportEqualsDeclaration>): string | null {
  if (node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference) {
    return null;
  }
  return getLiteralStringValue(node.moduleReference.expression);
}

/**
 * Returns the identifier for a named direct export declaration.
 *
 * @param declaration - Exported declaration to inspect.
 * @returns Declaration name, or null.
 */
function getNamedDirectExportName(declaration: Readonly<TSESTree.Node>): string | null {
  if (!isNamedDirectExportDeclaration(declaration)) {
    return null;
  }
  /* istanbul ignore next -- parser only exposes named direct export declarations with identifiers here. */
  return declaration.id?.name ?? null;
}

/**
 * Returns the removal range from a specifier through its following comma.
 *
 * @param sourceCode - ESLint source code helper.
 * @param specifier - Export specifier to remove.
 * @param commaToken - Following comma token.
 * @returns Removal range.
 */
function getSpecifierRangeWithNextComma(
  sourceCode: Readonly<TSESLint.SourceCode>,
  specifier: Readonly<TSESTree.ExportSpecifier>,
  commaToken: Readonly<TSESTree.Token>,
): TSESTree.Range {
  const tokenAfterComma = sourceCode.getTokenAfter(commaToken);
  return [specifier.range[0], tokenAfterComma?.range[0] ?? commaToken.range[1]];
}

/**
 * Returns a range that removes a specifier and an adjacent comma.
 *
 * @param sourceCode - ESLint source code helper.
 * @param specifier - Export specifier to remove.
 * @returns Removal range.
 */
function getSpecifierRemovalRange(
  sourceCode: Readonly<TSESLint.SourceCode>,
  specifier: Readonly<TSESTree.ExportSpecifier>,
): TSESTree.Range {
  const nextToken = sourceCode.getTokenAfter(specifier);
  if (isCommaToken(nextToken)) {
    return getSpecifierRangeWithNextComma(sourceCode, specifier, nextToken);
  }
  const previousToken = sourceCode.getTokenBefore(specifier);
  if (isCommaToken(previousToken)) {
    return [previousToken.range[0], specifier.range[1]];
  }
  /* istanbul ignore next -- single-specifier declarations are removed before range calculation. */
  return specifier.range;
}

/**
 * Returns a direct export name for single-declarator variable declarations.
 *
 * @param declaration - Variable declaration.
 * @returns Exported name, or null when unavailable.
 */
function getVariableDeclarationExportName(declaration: Readonly<TSESTree.VariableDeclaration>): string | null {
  const declarator = declaration.declarations[0];
  return declaration.declarations.length === 1 && declarator.id.type === AST_NODE_TYPES.Identifier
    ? declarator.id.name
    : null;
}

/**
 * Returns true when a direct export already exposes the specifier exported name.
 *
 * @param directExportNames - Direct export names.
 * @param specifier - Export specifier to inspect.
 * @returns True when the exported name already exists as a direct export.
 */
function hasDirectExportForSpecifier(
  directExportNames: Readonly<DirectExportNames>,
  specifier: Readonly<TSESTree.ExportSpecifier>,
): boolean {
  const exportedName = getIdentifierName(specifier.exported);
  return exportedName !== null && directExportNames.has(exportedName);
}

/**
 * Returns true when a token is a comma token.
 *
 * @param token - Token to inspect.
 * @returns True when the token is a comma.
 */
function isCommaToken(token: TSESTree.Token | null): token is TSESTree.Token {
  return token?.value === TOKEN_COMMA;
}

/**
 * Returns true when an indirect re-export has a redundant named export fix.
 *
 * @param directExportNames - Direct exported declaration names.
 * @param node - Export node that exposes the imported parent binding.
 * @param specifier - Named export specifier when available.
 * @returns True when the specifier can be removed.
 */
function isFixableNamedReExport(
  directExportNames: Readonly<DirectExportNames>,
  node:
    | TSESTree.ExportDefaultDeclaration
    | TSESTree.ExportNamedDeclaration
    | TSESTree.TSExportAssignment,
  specifier: Readonly<TSESTree.ExportSpecifier>,
): node is TSESTree.ExportNamedDeclaration {
  return (
    node.type === AST_NODE_TYPES.ExportNamedDeclaration &&
    hasDirectExportForSpecifier(directExportNames, specifier)
  );
}

/**
 * Returns true when a declaration directly exports a named declaration.
 *
 * @param declaration - Exported declaration to inspect.
 * @returns True when the declaration owns an identifier.
 */
function isNamedDirectExportDeclaration(
  declaration: Readonly<TSESTree.Node>,
): declaration is DirectNamedExportDeclaration {
  return (
    declaration.type === AST_NODE_TYPES.FunctionDeclaration ||
    declaration.type === AST_NODE_TYPES.ClassDeclaration ||
    declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
    declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration
  );
}

/**
 * Returns true when an export specifier list exposes a binding imported from a parent path.
 *
 * @param importedBindings - Collected imported binding names from parent paths.
 * @param specifiers - Export specifiers to inspect.
 * @returns True when any exported binding was imported from a parent path.
 */
function isParentImportExportSpecifier(
  importedBindings: Readonly<ImportedBindingNames>,
  specifier: Readonly<TSESTree.ExportSpecifier>,
): boolean {
  const localName = getIdentifierName(specifier.local);
  return localName !== null && importedBindings.has(localName);
}

/**
 * Removes a redundant export specifier.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Export declaration node.
 * @param specifier - Export specifier to remove.
 * @param fixer - ESLint fixer.
 * @returns Generated removal fix.
 */
function removeExportSpecifier(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.ExportNamedDeclaration>,
  specifier: Readonly<TSESTree.ExportSpecifier>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  if (node.specifiers.length === 1) {
    return fixer.remove(node);
  }
  return fixer.removeRange(getSpecifierRemovalRange(sourceCode, specifier));
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
  context: Readonly<NoReExportContext>,
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
 * @param directExportNames - Direct exported declaration names.
 * @param node - Export node that exposes the imported parent binding.
 * @param specifier - Named export specifier when available.
 */
function reportIndirectParentReExport(
  context: Readonly<NoReExportContext>,
  directExportNames: Readonly<DirectExportNames>,
  node:
    | TSESTree.ExportDefaultDeclaration
    | TSESTree.ExportNamedDeclaration
    | TSESTree.TSExportAssignment,
  specifier?: Readonly<TSESTree.ExportSpecifier>,
): void {
  context.report({
    node: specifier ?? node,
    messageId: 'noReExport',
    fix: createIndirectParentReExportFix(context, directExportNames, node, specifier),
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
    fixable: 'code',
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
