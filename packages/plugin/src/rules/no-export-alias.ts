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
import { isIdentifierNode } from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

type NoExportAliasContext = Readonly<TSESLint.RuleContext<'noExportAlias', []>>;
type ExportAliasInfo = { local: string; alias: string };
const EXPORT_KIND_TYPE = 'type';

/**
 * Checks named export declarations for alias specifiers.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code utility from ESLint context.
 * @param node - Named export declaration to inspect.
 */
function checkExportNamedDeclaration(
  context: NoExportAliasContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.ExportNamedDeclaration,
): void {
  for (const specifier of node.specifiers) {
    reportAliasSpecifier(context, sourceCode, specifier);
  }
}

/**
 * Creates listeners that enforce direct exports without aliases.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoExportAliasListeners(context: NoExportAliasContext): TSESLint.RuleListener {
  const sourceCode = context.sourceCode;

  return {
    ExportNamedDeclaration: checkExportNamedDeclaration.bind(undefined, context, sourceCode),
  };
}

/**
 * Builds replacement text that removes aliasing while preserving `type` exports.
 *
 * @param sourceCode - Source code utility from ESLint context.
 * @param specifier - Export specifier to rewrite.
 * @returns Replacement export specifier text.
 */
function createSpecifierReplacement(
  sourceCode: Readonly<TSESLint.SourceCode>,
  specifier: TSESTree.ExportSpecifier,
): string {
  const localText = sourceCode.getText(specifier.local);
  const typePrefix = specifier.exportKind === EXPORT_KIND_TYPE ? `${EXPORT_KIND_TYPE} ` : '';
  return `${typePrefix}${localText}`;
}

/**
 * Builds a fix that rewrites aliased export specifiers.
 *
 * @param sourceCode - Source code utility from ESLint context.
 * @param specifier - Export specifier node.
 * @param fixer - ESLint fixer utility.
 * @returns Rule fix operation.
 */
function fixAliasSpecifier(
  sourceCode: Readonly<TSESLint.SourceCode>,
  specifier: TSESTree.ExportSpecifier,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  return fixer.replaceText(specifier, createSpecifierReplacement(sourceCode, specifier));
}

/**
 * Returns alias/local names when export specifier is an alias.
 * @param specifier - The export specifier to analyze.
 * @returns Object with local and alias names if it's an alias, null otherwise.
 */
function getAliasInfo(specifier: TSESTree.ExportSpecifier): ExportAliasInfo | null {
  const localName = getSpecifierName(specifier.local);
  const exportedName = getSpecifierName(specifier.exported);

  const isValidAlias = localName !== exportedName;

  return isValidAlias ? { local: localName, alias: exportedName } : null;
}

/**
 * Extracts the name from an identifier or string literal specifier.
 *
 * @param node - The specifier node (Identifier or StringLiteral).
 * @returns The extracted name, or null if not a valid specifier.
 */
function getSpecifierName(node: TSESTree.Identifier | TSESTree.StringLiteral): string {
  if (isIdentifierNode(node)) {
    return node.name;
  }
  return node.value;
}

/**
 * Reports aliased export specifiers and provides an autofix.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - Source code utility from ESLint context.
 * @param specifier - Export specifier to inspect.
 */
function reportAliasSpecifier(
  context: NoExportAliasContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  specifier: TSESTree.ExportSpecifier,
): void {
  const aliasInfo = getAliasInfo(specifier);
  if (aliasInfo === null) {
    return;
  }

  context.report({
    node: specifier,
    messageId: 'noExportAlias',
    data: aliasInfo,
    fix: fixAliasSpecifier.bind(undefined, sourceCode, specifier),
  });
}

/**
 * ESLint rule that prevents use of alias in export statements.
 */
export const noExportAlias = createRule({
  name: 'no-export-alias',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Prevent use of alias in export statements',
    },
    messages: {
      noExportAlias: 'Export alias "{{alias}}" is not allowed; export "{{local}}" directly',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoExportAliasListeners,
});

export default noExportAlias;
