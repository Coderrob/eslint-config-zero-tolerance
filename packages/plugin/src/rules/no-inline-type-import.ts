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

const IMPORT_KIND_TYPE = 'type';
const MODULE_NAME_MATCH_INDEX = 1;
const PARENT_PROPERTY_KEY = 'parent';
const TYPE_NAME_MATCH_INDEX = 2;

type NoInlineTypeImportContext = Readonly<TSESLint.RuleContext<'noInlineTypeImport', []>>;
type InlineTypeImportFixInputs = Readonly<{
  moduleName: string;
  typeName: string;
}>;
type InlineTypeImportFixTarget = Readonly<{
  node: TSESTree.TSImportType;
  fixInputs: InlineTypeImportFixInputs;
}>;

/**
 * Adds one missing type import to a module group.
 *
 * @param program - Program node.
 * @param missingImportTypes - Mutable missing import groups.
 * @param fixInputs - Fix inputs.
 */
function addMissingImportType(
  program: Readonly<TSESTree.Program>,
  missingImportTypes: Readonly<Map<string, Set<string>>>,
  fixInputs: Readonly<InlineTypeImportFixInputs>,
): void {
  if (hasReusableTypeImport(program, fixInputs)) {
    return;
  }
  const typeNames = missingImportTypes.get(fixInputs.moduleName) ?? new Set<string>();
  typeNames.add(fixInputs.typeName);
  missingImportTypes.set(fixInputs.moduleName, typeNames);
}

/**
 * Adds one property value's child nodes to a collection.
 *
 * @param childNodes - Mutable child node collection.
 * @param key - Property key.
 * @param value - Property value.
 */
function collectChildNodeValue(childNodes: readonly TSESTree.Node[], key: string, value: unknown): void {
  if (key === PARENT_PROPERTY_KEY) {
    return;
  }
  if (Array.isArray(value)) {
    collectChildNodeValues(childNodes, value);
    return;
  }
  if (isNodeLike(value)) {
    childNodes.push(value);
  }
}

/**
 * Adds child nodes from an array property value to a collection.
 *
 * @param childNodes - Mutable child node collection.
 * @param values - Property array values.
 */
function collectChildNodeValues(childNodes: readonly TSESTree.Node[], values: readonly unknown[]): void {
  for (const value of values) {
    if (isNodeLike(value)) {
      childNodes.push(value);
    }
  }
}

/**
 * Recursively collects inline import targets.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Node to inspect.
 * @param targets - Mutable target collection.
 */
function collectInlineTypeImportFixTargets(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
  targets: readonly InlineTypeImportFixTarget[],
): void {
  if (node.type === AST_NODE_TYPES.TSImportType) {
    const fixInputs = getInlineTypeImportFixInputs(sourceCode, node);
    if (fixInputs !== null) {
      targets.push({ node, fixInputs });
    }
  }
  for (const child of getChildNodes(node)) {
    collectInlineTypeImportFixTargets(sourceCode, child, targets);
  }
}

/**
 * Creates one type import declaration.
 *
 * @param moduleName - Module specifier.
 * @param typeNames - Type names to import.
 * @returns Import declaration text.
 */
function createImportDeclarationText(moduleName: string, typeNames: readonly string[]): string {
  return `import type { ${typeNames.join(', ')} } from "${moduleName}";\n`;
}

/**
 * Creates the import type insertion fix.
 *
 * @param sourceCode - ESLint source code helper.
 * @param importText - Import declaration text to insert.
 * @param fixer - ESLint fixer.
 * @returns Generated insertion fix.
 */
function createImportTypeInsertion(
  sourceCode: Readonly<TSESLint.SourceCode>,
  importText: string,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const lastImport = getLastImportDeclaration(sourceCode.ast);
  if (lastImport === null) {
    return fixer.insertTextBefore(sourceCode.ast.body[0], importText);
  }
  return fixer.insertTextAfter(lastImport, `\n${importText}`);
}

/**
 * Creates import insertion fixes for type imports that are not already reusable.
 *
 * @param sourceCode - ESLint source code helper.
 * @param targets - Fix targets.
 * @param fixer - ESLint fixer.
 * @returns Import insertion fixes.
 */
function createImportTypeInsertionFixes(
  sourceCode: Readonly<TSESLint.SourceCode>,
  targets: readonly InlineTypeImportFixTarget[],
  fixer: Readonly<TSESLint.RuleFixer>,
): readonly TSESLint.RuleFix[] {
  const importText = createMissingImportTypeText(sourceCode.ast, targets);
  return importText === '' ? [] : [createImportTypeInsertion(sourceCode, importText, fixer)];
}

/**
 * Creates one-pass fixes for every safely fixable inline type import in the file.
 *
 * @param sourceCode - ESLint source code helper.
 * @param fixer - ESLint fixer.
 * @returns Generated fixes.
 */
function createInlineTypeImportFixes(
  sourceCode: Readonly<TSESLint.SourceCode>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix[] {
  const targets = getSafeInlineTypeImportFixTargets(sourceCode);
  const fixes = [...createImportTypeInsertionFixes(sourceCode, targets, fixer)];
  for (const target of targets) {
    fixes.push(fixer.replaceText(target.node, target.fixInputs.typeName));
  }
  return fixes;
}

/**
 * Creates import declaration text for missing type imports grouped by module.
 *
 * @param program - Program node.
 * @param targets - Fix targets.
 * @returns Import declaration text.
 */
function createMissingImportTypeText(
  program: Readonly<TSESTree.Program>,
  targets: readonly InlineTypeImportFixTarget[],
): string {
  const declarations: string[] = [];
  for (const [moduleName, typeNames] of getMissingImportTypesByModule(program, targets)) {
    declarations.push(createImportDeclarationText(moduleName, typeNames));
  }
  return declarations.join('');
}

/**
 * Creates listeners that ban inline TypeScript `import("...")` type queries.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoInlineTypeImportListeners(
  context: Readonly<NoInlineTypeImportContext>,
): TSESLint.RuleListener {
  return {
    TSImportType: reportInlineTypeImport.bind(undefined, context),
  };
}

/**
 * Fixes a simple inline import type by adding/reusing a top-level type import.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - TS import type node to replace.
 * @param fixInputs - Fix inputs.
 * @param fixer - ESLint fixer.
 * @returns Generated fix operations, or null when unsafe.
 */
function fixInlineTypeImport(
  sourceCode: Readonly<TSESLint.SourceCode>,
  fixInputs: Readonly<InlineTypeImportFixInputs>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix[] | null {
  if (!isSafeInlineTypeImportFix(sourceCode.ast, fixInputs)) {
    return null;
  }
  return createInlineTypeImportFixes(sourceCode, fixer);
}

/**
 * Returns child nodes for recursive traversal.
 *
 * @param node - Node to inspect.
 * @returns Child nodes.
 */
function getChildNodes(node: Readonly<TSESTree.Node>): TSESTree.Node[] {
  const childNodes: TSESTree.Node[] = [];
  for (const [key, value] of Object.entries(node)) {
    collectChildNodeValue(childNodes, key, value);
  }
  return childNodes;
}

/**
 * Returns import specifier local names.
 *
 * @param statement - Import declaration to inspect.
 * @returns Local binding names.
 */
function getImportSpecifierLocalNames(statement: Readonly<TSESTree.ImportDeclaration>): readonly string[] {
  const names: string[] = [];
  for (const specifier of statement.specifiers) {
    names.push(specifier.local.name);
  }
  return names;
}

/**
 * Returns fix inputs for simple import("module").Name references.
 *
 * @param node - TS import type node to inspect.
 * @returns Fix inputs, or null when the import type is not safely fixable.
 * @param node TODO: describe parameter
 */
function getInlineTypeImportFixInputs(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSImportType>,
): InlineTypeImportFixInputs | null {
  const match = /^import\("([^"]+)"\)\.([A-Za-z_$][\w$]*)$/u.exec(sourceCode.getText(node));
  if (match === null) {
    return null;
  }
  return {
    moduleName: match[MODULE_NAME_MATCH_INDEX],
    typeName: match[TYPE_NAME_MATCH_INDEX],
  };
}

/**
 * Returns inline import targets with simple import("module").Name syntax.
 *
 * @param sourceCode - ESLint source code helper.
 * @returns Fix targets.
 */
function getInlineTypeImportFixTargets(
  sourceCode: Readonly<TSESLint.SourceCode>,
): readonly InlineTypeImportFixTarget[] {
  const targets: InlineTypeImportFixTarget[] = [];
  collectInlineTypeImportFixTargets(sourceCode, sourceCode.ast, targets);
  return targets;
}

/**
 * Returns the last top-level import declaration.
 *
 * @param program - Program node.
 * @returns Last import declaration, or null when none exist.
 */
function getLastImportDeclaration(program: Readonly<TSESTree.Program>): TSESTree.ImportDeclaration | null {
  let lastImport: TSESTree.ImportDeclaration | null = null;
  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
      lastImport = statement;
    }
  }
  return lastImport;
}

/**
 * Groups missing type imports by module.
 *
 * @param program - Program node.
 * @param targets - Fix targets.
 * @returns Module/type-name entries.
 */
function getMissingImportTypesByModule(
  program: Readonly<TSESTree.Program>,
  targets: readonly InlineTypeImportFixTarget[],
): ReadonlyMap<string, readonly string[]> {
  const missingImportTypes = new Map<string, Set<string>>();
  for (const target of targets) {
    addMissingImportType(program, missingImportTypes, target.fixInputs);
  }
  const sortedMissingImportTypes = new Map<string, readonly string[]>();
  for (const [moduleName, typeNames] of missingImportTypes) {
    sortedMissingImportTypes.set(moduleName, Array.from(typeNames).sort());
  }
  return sortedMissingImportTypes;
}

/**
 * Returns inline import targets that can be fixed without introducing name collisions.
 *
 * @param sourceCode - ESLint source code helper.
 * @returns Fix targets.
 */
function getSafeInlineTypeImportFixTargets(
  sourceCode: Readonly<TSESLint.SourceCode>,
): readonly InlineTypeImportFixTarget[] {
  const safeTargets: InlineTypeImportFixTarget[] = [];
  for (const target of getInlineTypeImportFixTargets(sourceCode)) {
    if (isSafeInlineTypeImportFix(sourceCode.ast, target.fixInputs)) {
      safeTargets.push(target);
    }
  }
  return safeTargets;
}

/**
 * Returns top-level binding names from one statement.
 *
 * @param statement - Program statement to inspect.
 * @returns Binding names.
 */
function getTopLevelBindingNames(statement: Readonly<TSESTree.ProgramStatement>): readonly string[] {
  if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
    return getImportSpecifierLocalNames(statement);
  }
  if (
    statement.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
    statement.type === AST_NODE_TYPES.TSInterfaceDeclaration
  ) {
    return [statement.id.name];
  }
  return [];
}

/**
 * Returns true when an import declaration has a local specifier name.
 *
 * @param statement - Import declaration to inspect.
 * @param typeName - Local type name to find.
 * @returns True when a matching specifier exists.
 */
function hasImportSpecifier(statement: Readonly<TSESTree.ImportDeclaration>, typeName: string): boolean {
  for (const specifier of statement.specifiers) {
    if (specifier.local.name === typeName) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a matching top-level type import already exists.
 *
 * @param program - Program node.
 * @param fixInputs - Fix inputs.
 * @returns True when an import type specifier can be reused.
 */
function hasReusableTypeImport(
  program: Readonly<TSESTree.Program>,
  fixInputs: Readonly<InlineTypeImportFixInputs>,
): boolean {
  for (const statement of program.body) {
    if (isReusableTypeImport(statement, fixInputs)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when any top-level binding already uses the requested type name.
 *
 * @param program - Program node.
 * @param typeName - Type name to inspect.
 * @returns True when the name is already bound.
 */
function hasTopLevelBinding(program: Readonly<TSESTree.Program>, typeName: string): boolean {
  for (const statement of program.body) {
    if (getTopLevelBindingNames(statement).includes(typeName)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a value is an AST node.
 *
 * @param value - Value to inspect.
 * @returns True when the value is node-like.
 */
function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof Reflect.get(value, 'type') === 'string'
  );
}

/**
 * Returns true when one statement imports the requested type from the requested module.
 *
 * @param statement - Program statement to inspect.
 * @param fixInputs - Fix inputs.
 * @returns True when the statement imports the type.
 */
function isReusableTypeImport(
  statement: Readonly<TSESTree.ProgramStatement>,
  fixInputs: Readonly<InlineTypeImportFixInputs>,
): boolean {
  return (
    statement.type === AST_NODE_TYPES.ImportDeclaration &&
    statement.importKind === IMPORT_KIND_TYPE &&
    statement.source.value === fixInputs.moduleName &&
    hasImportSpecifier(statement, fixInputs.typeName)
  );
}

/**
 * Returns true when one inline import can be replaced safely.
 *
 * @param program - Program node.
 * @param fixInputs - Fix inputs.
 * @returns True when the import can be reused or inserted collision-free.
 */
function isSafeInlineTypeImportFix(
  program: Readonly<TSESTree.Program>,
  fixInputs: Readonly<InlineTypeImportFixInputs>,
): boolean {
  return (
    hasReusableTypeImport(program, fixInputs) || !hasTopLevelBinding(program, fixInputs.typeName)
  );
}

/**
 * Reports TypeScript inline `import("...")` type queries.
 *
 * @param context - ESLint rule execution context.
 * @param node - TS import type node to report.
 */
function reportInlineTypeImport(
  context: Readonly<NoInlineTypeImportContext>,
  node: Readonly<TSESTree.TSImportType>,
): void {
  const fixInputs = getInlineTypeImportFixInputs(context.sourceCode, node);
  context.report({
    node,
    messageId: 'noInlineTypeImport',
    fix:
      fixInputs === null
        ? null
        : fixInlineTypeImport.bind(undefined, context.sourceCode, fixInputs),
  });
}

/**
 * ESLint rule that disallows TypeScript inline type import queries.
 */
export const noInlineTypeImport = createRule({
  name: 'no-inline-type-import',
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Disallow TypeScript inline type imports using import("...")',
    },
    messages: {
      noInlineTypeImport:
        'Inline type import syntax import("...") is not allowed; use top-level import type declarations instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoInlineTypeImportListeners,
});

export default noInlineTypeImport;
