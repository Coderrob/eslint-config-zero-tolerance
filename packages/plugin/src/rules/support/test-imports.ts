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

const IMPORT_BINDING_TYPE = 'ImportBinding';

/**
 * Finds the nearest lexical binding for an identifier.
 *
 * @param scope - Scope to inspect.
 * @param name - Identifier name.
 * @returns Nearest binding or null.
 */
function findBinding(
  scope: TSESLint.Scope.Scope | null,
  name: string,
): TSESLint.Scope.Variable | null {
  if (scope === null) {
    return null;
  }
  return scope.set.get(name) ?? findBinding(scope.upper, name);
}

/**
 * Finds the nearest lexical binding for an identifier.
 *
 * @param context - Rule execution context.
 * @param node - Identifier to resolve.
 * @returns The nearest binding or null.
 */
export function getBinding(
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
  node: Readonly<TSESTree.Identifier>,
): TSESLint.Scope.Variable | null {
  return findBinding(context.sourceCode.getScope(node), node.name);
}

/**
 * Finds the import declaration that defines an identifier.
 *
 * @param context - Rule execution context.
 * @param node - Identifier to resolve.
 * @returns Import definition or null.
 */
function getImportDefinition(
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
  node: Readonly<TSESTree.Identifier>,
): TSESLint.Scope.Definition | null {
  const binding = getBinding(context, node);
  return binding?.defs.find(isImportBinding) ?? null;
}

/**
 * Checks whether a definition is an import binding.
 *
 * @param definition - Binding definition.
 * @returns Whether the definition is an import binding.
 */
function isImportBinding(definition: Readonly<TSESLint.Scope.Definition>): boolean {
  return definition.type === IMPORT_BINDING_TYPE;
}

/**
 * Checks whether an identifier is a default or namespace import from a module.
 *
 * @param context - Rule execution context.
 * @param node - Identifier to resolve.
 * @param moduleName - Expected module specifier.
 * @returns Whether the identifier imports the module object.
 */
export function isModuleImport(
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
  node: Readonly<TSESTree.Identifier>,
  moduleName: string,
): boolean {
  const definition = getImportDefinition(context, node);
  return (
    definition !== null &&
    isSourceModule(definition, moduleName) &&
    (definition.node.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
      definition.node.type === AST_NODE_TYPES.ImportNamespaceSpecifier)
  );
}

/**
 * Checks whether an identifier is a named import from a module.
 *
 * @param context - Rule execution context.
 * @param node - Identifier to resolve.
 * @param moduleName - Expected module specifier.
 * @param importedName - Expected exported name.
 * @returns Whether the identifier imports that exported name.
 */
export function isNamedImport(
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
  node: Readonly<TSESTree.Identifier>,
  moduleName: string,
  importedName: string,
): boolean {
  const definition = getImportDefinition(context, node);
  return (
    definition !== null &&
    isSourceModule(definition, moduleName) &&
    isNamedSpecifier(definition, importedName)
  );
}

/**
 * Checks the exported name selected by an import binding.
 *
 * @param definition - Import definition.
 * @param importedName - Expected exported name.
 * @returns Whether the binding selects that name.
 */
function isNamedSpecifier(
  definition: Readonly<TSESLint.Scope.Definition>,
  importedName: string,
): boolean {
  return (
    definition.node.type === AST_NODE_TYPES.ImportSpecifier &&
    definition.node.imported.type === AST_NODE_TYPES.Identifier &&
    definition.node.imported.name === importedName
  );
}

/**
 * Checks the module specifier of an import definition.
 *
 * @param definition - Import definition.
 * @param moduleName - Expected module specifier.
 * @returns Whether the import originates in the module.
 */
function isSourceModule(
  definition: Readonly<TSESLint.Scope.Definition>,
  moduleName: string,
): boolean {
  return (
    definition.parent?.type === AST_NODE_TYPES.ImportDeclaration &&
    definition.parent.source.value === moduleName
  );
}
