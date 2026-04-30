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

enum NoIndexedAccessTypesMessageId {
  ExtractIndexedAccessType = 'extractIndexedAccessType',
  NoIndexedAccessTypes = 'noIndexedAccessTypes',
}
type RuleOptions = [INoIndexedAccessTypesOptions?];
type NoIndexedAccessTypesContext = Readonly<
  TSESLint.RuleContext<NoIndexedAccessTypesMessageId, RuleOptions>
>;

interface INoIndexedAccessTypesOptions {
  readonly aliasNamePattern?: string;
}

/**
 * Applies configured placeholders to build a type alias name.
 *
 * @param pattern - Alias name pattern.
 * @param objectName - Sanitized object type name.
 * @param propertyName - Sanitized property/index name.
 * @param indexName - Sanitized index type name.
 * @returns Generated alias name.
 */
function applyAliasNamePattern(
  pattern: string,
  objectName: string,
  propertyName: string,
  indexName: string,
): string {
  return pattern
    .split('{object}')
    .join(objectName)
    .split('{property}')
    .join(propertyName)
    .split('{index}')
    .join(indexName);
}

/**
 * Creates configured extraction suggestions for indexed access types.
 *
 * @param context - ESLint rule execution context.
 * @param node - Indexed access type node to report.
 * @returns Suggestion entries.
 */
function createExtractTypeSuggestions(
  context: Readonly<NoIndexedAccessTypesContext>,
  node: Readonly<TSESTree.TSIndexedAccessType>,
): TSESLint.ReportSuggestionArray<NoIndexedAccessTypesMessageId> {
  const aliasName = getGeneratedAliasName(context, node);
  if (aliasName === null || hasTopLevelBinding(context.sourceCode.ast, aliasName)) {
    return [];
  }
  return [
    {
      messageId: NoIndexedAccessTypesMessageId.ExtractIndexedAccessType,
      data: { name: aliasName },
      fix: replaceWithExtractedTypeAlias.bind(undefined, context.sourceCode, node, aliasName),
    },
  ];
}

/**
 * Creates listeners that report TypeScript indexed access types.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoIndexedAccessTypesListeners(
  context: Readonly<NoIndexedAccessTypesContext>,
): TSESLint.RuleListener {
  return {
    TSIndexedAccessType: reportIndexedAccessType.bind(undefined, context),
  };
}

/**
 * Returns the configured generated alias name.
 *
 * @param context - ESLint rule execution context.
 * @param node - Indexed access type node.
 * @returns Generated alias name, or null when not configured.
 */
function getGeneratedAliasName(
  context: Readonly<NoIndexedAccessTypesContext>,
  node: Readonly<TSESTree.TSIndexedAccessType>,
): string | null {
  const pattern = context.options[0]?.aliasNamePattern;
  if (pattern === undefined) {
    return null;
  }
  const sourceCode = context.sourceCode;
  const objectName = sanitizeTypeAliasPart(sourceCode.getText(node.objectType));
  const indexName = sanitizeTypeAliasPart(sourceCode.getText(node.indexType));
  const propertyName = getIndexedAccessPropertyName(sourceCode, node.indexType);
  return applyAliasNamePattern(pattern, objectName, propertyName, indexName);
}

/**
 * Returns a sanitized property name for an indexed access type.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Indexed access index type.
 * @returns Sanitized property/index name.
 */
function getIndexedAccessPropertyName(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TypeNode>,
): string {
  if (node.type === AST_NODE_TYPES.TSLiteralType) {
    return sanitizeTypeAliasPart(sourceCode.getText(node.literal));
  }
  return sanitizeTypeAliasPart(sourceCode.getText(node));
}

/**
 * Walks to the nearest ancestor whose parent is the Program node.
 *
 * @param node - Node to inspect.
 * @returns Nearest top-level node.
 */
function getNearestTopLevelNode(node: Readonly<TSESTree.Node>): TSESTree.Node {
  if (node.parent === undefined || node.parent.type === AST_NODE_TYPES.Program) {
    return node;
  }
  return getNearestTopLevelNode(node.parent);
}

/**
 * Returns the nearest top-level statement that contains the node.
 *
 * @param node - Node to inspect.
 * @returns Top-level statement, or null when none is available.
 */
function getNearestTopLevelStatement(
  node: Readonly<TSESTree.Node>,
): TSESTree.ProgramStatement | null {
  const currentNode = getNearestTopLevelNode(node);
  /* istanbul ignore next -- parser-produced TSIndexedAccessType nodes always have a statement ancestor. */
  if (!isProgramStatement(currentNode)) {
    return null;
  }
  return currentNode;
}

/**
 * Returns a top-level binding name for declarations that create one binding.
 *
 * @param statement - Program statement to inspect.
 * @returns Binding name, or null when unavailable.
 */
function getTopLevelBindingName(statement: Readonly<TSESTree.ProgramStatement>): string | null {
  if (statement.type === AST_NODE_TYPES.TSTypeAliasDeclaration) {
    return statement.id.name;
  }
  if (statement.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
    return statement.id.name;
  }
  if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
    return getVariableDeclarationBindingName(statement);
  }
  return null;
}

/**
 * Returns the name from a single-declarator variable declaration.
 *
 * @param statement - Variable declaration to inspect.
 * @returns Binding name, or null.
 */
function getVariableDeclarationBindingName(
  statement: Readonly<TSESTree.VariableDeclaration>,
): string | null {
  const declaration = statement.declarations[0];
  /* istanbul ignore next -- multi-declarator variable collision handling is intentionally conservative. */
  return statement.declarations.length === 1 && declaration.id.type === AST_NODE_TYPES.Identifier
    ? declaration.id.name
    : null;
}

/**
 * Returns true when a statement declares the requested top-level binding.
 *
 * @param name - Binding name to check.
 * @param statement - Program statement to inspect.
 * @returns True when the statement declares the binding.
 */
function hasMatchingTopLevelBinding(
  name: string,
  statement: Readonly<TSESTree.ProgramStatement>,
): boolean {
  return getTopLevelBindingName(statement) === name;
}

/**
 * Returns true when the program already has a top-level binding with the provided name.
 *
 * @param program - Program node.
 * @param name - Binding name to check.
 * @returns True when the binding exists.
 */
function hasTopLevelBinding(program: Readonly<TSESTree.Program>, name: string): boolean {
  return program.body.some(hasMatchingTopLevelBinding.bind(undefined, name));
}

/**
 * Returns true when a node is a top-level program statement.
 *
 * @param node - Node to inspect.
 * @returns True when the node is a program statement.
 */
function isProgramStatement(node: Readonly<TSESTree.Node>): node is TSESTree.ProgramStatement {
  return node.parent?.type === AST_NODE_TYPES.Program;
}

/**
 * Inserts a named alias and replaces the indexed access with that alias.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Indexed access type node.
 * @param aliasName - Generated alias name.
 * @param fixer - ESLint fixer.
 * @returns Generated fixes.
 */
function replaceWithExtractedTypeAlias(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSIndexedAccessType>,
  aliasName: string,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix[] {
  const statement = getNearestTopLevelStatement(node);
  /* istanbul ignore next -- parser-produced indexed access nodes always have a statement ancestor. */
  if (statement === null) {
    return [];
  }
  const aliasText = `type ${aliasName} = ${sourceCode.getText(node)};\n`;
  return [fixer.insertTextBefore(statement, aliasText), fixer.replaceText(node, aliasName)];
}

/**
 * Reports a TypeScript indexed access type.
 *
 * @param context - ESLint rule execution context.
 * @param node - Indexed access type node to report.
 */
function reportIndexedAccessType(
  context: Readonly<NoIndexedAccessTypesContext>,
  node: Readonly<TSESTree.TSIndexedAccessType>,
): void {
  const suggestions = createExtractTypeSuggestions(context, node);
  context.report({
    node,
    messageId: NoIndexedAccessTypesMessageId.NoIndexedAccessTypes,
    ...(suggestions.length > 0 ? { suggest: suggestions } : {}),
  });
}

/**
 * Sanitizes source text for use as a PascalCase type alias segment.
 *
 * @param value - Source text to sanitize.
 * @returns PascalCase identifier segment.
 */
function sanitizeTypeAliasPart(value: string): string {
  const words = value.match(/[A-Za-z0-9]+/gu) ?? [];
  return words.map(toPascalCase).join('');
}

/**
 * Converts a word to PascalCase.
 *
 * @param value - Word to convert.
 * @returns PascalCase word.
 */
function toPascalCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

/**
 * ESLint rule that disallows TypeScript indexed access types.
 */
export const noIndexedAccessTypes = createRule({
  name: 'no-indexed-access-types',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description: 'Disallow TypeScript indexed access types',
    },
    messages: {
      extractIndexedAccessType: 'Extract this indexed access type to "{{name}}".',
      noIndexedAccessTypes:
        'Indexed access types are not allowed; extract an explicit named type instead',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          aliasNamePattern: { type: 'string' },
        },
      },
    ],
  },
  defaultOptions: [{}],
  create: createNoIndexedAccessTypesListeners,
});

export default noIndexedAccessTypes;
