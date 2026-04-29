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
import { INTERFACE_REQUIRED_PREFIX } from './support/rule-constants';
import { createRule } from './support/rule-factory';

const INTERFACE_SECOND_CHARACTER_INDEX = 1;
const INTERFACE_MINIMUM_LENGTH = 2;
const PARENT_PROPERTY_KEY = 'parent';
const TS_INTERFACE_HERITAGE_NODE_TYPE = 'TSInterfaceHeritage';

type RequireInterfacePrefixContext = Readonly<TSESLint.RuleContext<'interfacePrefix', []>>;

/**
 * Checks a TypeScript interface declaration for proper naming.
 *
 * @param context - ESLint rule execution context.
 * @param node - The TSInterfaceDeclaration node to check.
 */
function checkTSInterfaceDeclaration(
  context: Readonly<RequireInterfacePrefixContext>,
  node: Readonly<TSESTree.TSInterfaceDeclaration>,
): void {
  const interfaceName = node.id.name;
  if (isValidInterfaceName(interfaceName)) {
    return;
  }
  context.report({
    node: node.id,
    messageId: 'interfacePrefix',
    data: { name: interfaceName },
    fix: createInterfacePrefixFix(context.sourceCode, node),
  });
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
 * Recursively collects same-file interface name references.
 *
 * @param node - Node to inspect.
 * @param currentName - Current interface name.
 * @param references - Mutable reference collection.
 */
function collectInterfaceNameReferenceNodes(
  node: Readonly<TSESTree.Node>,
  currentName: string,
  references: readonly TSESTree.Identifier[],
): void {
  if (isInterfaceNameReferenceNode(node, currentName)) {
    references.push(node);
  }
  for (const child of getChildNodes(node)) {
    collectInterfaceNameReferenceNodes(child, currentName, references);
  }
}

/**
 * Creates a same-file interface rename fix when the prefixed name is collision-free.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Interface declaration node.
 * @returns Fix callback, or null when unsafe.
 */
function createInterfacePrefixFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.TSInterfaceDeclaration>,
): TSESLint.ReportFixFunction | null {
  const replacementName = `${INTERFACE_REQUIRED_PREFIX}${node.id.name}`;
  if (!isPotentialInterfacePrefixFix(node.id.name) || hasTopLevelName(sourceCode.ast, replacementName)) {
    return null;
  }
  return replaceInterfaceNameReferences.bind(undefined, sourceCode.ast, node.id.name, replacementName);
}

/**
 * Creates listeners for require-interface-prefix rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireInterfacePrefixListeners(
  context: Readonly<RequireInterfacePrefixContext>,
): TSESLint.RuleListener {
  return {
    TSInterfaceDeclaration: checkTSInterfaceDeclaration.bind(undefined, context),
  };
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
 * Returns identifier nodes that reference the interface name in type positions.
 *
 * @param program - Program node.
 * @param currentName - Current interface name.
 * @returns Matching identifier nodes.
 */
function getInterfaceNameReferenceNodes(
  program: Readonly<TSESTree.Program>,
  currentName: string,
): TSESTree.Identifier[] {
  const references: TSESTree.Identifier[] = [];
  collectInterfaceNameReferenceNodes(program, currentName, references);
  return references;
}

/**
 * Returns a top-level declaration name.
 *
 * @param statement - Program statement.
 * @returns Top-level declaration name, or null.
 */
function getTopLevelName(statement: Readonly<TSESTree.ProgramStatement>): string | null {
  if (statement.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
    return statement.id.name;
  }
  if (statement.type === AST_NODE_TYPES.TSTypeAliasDeclaration) {
    return statement.id.name;
  }
  return null;
}

/**
 * Returns true when the program already declares a top-level name.
 *
 * @param program - Program node.
 * @param name - Name to check.
 * @returns True when the name exists.
 */
function hasTopLevelName(program: Readonly<TSESTree.Program>, name: string): boolean {
  for (const statement of program.body) {
    if (getTopLevelName(statement) === name) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when an identifier is an interface declaration identifier.
 *
 * @param parent - Parent node to inspect.
 * @param node - Identifier node.
 * @returns True when the identifier declares the interface name.
 */
function isInterfaceDeclarationIdentifier(
  parent: Readonly<TSESTree.Node>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return parent.type === AST_NODE_TYPES.TSInterfaceDeclaration && parent.id === node;
}

/**
 * Returns true when a parent node is an interface heritage reference.
 *
 * @param parent - Parent node to inspect.
 * @param node - Identifier node.
 * @returns True when the identifier is an interface heritage expression.
 */
function isInterfaceHeritageReference(parent: Readonly<TSESTree.Node>, node: Readonly<TSESTree.Identifier>): boolean {
  return (
    parent.type === TS_INTERFACE_HERITAGE_NODE_TYPE &&
    'expression' in parent &&
    parent.expression === node
  );
}

/**
 * Returns true when an identifier is the declaration or a type-position reference.
 *
 * @param node - Node to inspect.
 * @param currentName - Current interface name.
 * @returns True when the identifier should be renamed.
 */
function isInterfaceNameReferenceNode(
  node: Readonly<TSESTree.Node>,
  currentName: string,
): node is TSESTree.Identifier {
  if (node.type !== AST_NODE_TYPES.Identifier || node.name !== currentName) {
    return false;
  }
  const parent = node.parent;
  return isInterfaceDeclarationIdentifier(parent, node) || isInterfaceTypeReference(parent, node);
}

/**
 * Returns true when an identifier is an interface type reference.
 *
 * @param parent - Parent node to inspect.
 * @param node - Identifier node.
 * @returns True when the identifier references the interface in a type position.
 */
function isInterfaceTypeReference(parent: Readonly<TSESTree.Node>, node: Readonly<TSESTree.Identifier>): boolean {
  return (
    (parent.type === AST_NODE_TYPES.TSTypeReference && parent.typeName === node) ||
    isInterfaceHeritageReference(parent, node)
  );
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
 * Returns true when an interface name can be safely prefixed.
 *
 * @param interfaceName - Interface name.
 * @returns True when the name starts with a capital letter and is not already I-prefixed.
 */
function isPotentialInterfacePrefixFix(interfaceName: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/u.test(interfaceName) && !interfaceName.startsWith(INTERFACE_REQUIRED_PREFIX);
}

/**
 * Checks if an interface name follows the required naming convention.
 *
 * @param interfaceName - The interface name to validate.
 * @returns True if the name is valid, false otherwise.
 */
function isValidInterfaceName(interfaceName: string): boolean {
  if (!interfaceName.startsWith(INTERFACE_REQUIRED_PREFIX)) {
    return false;
  }
  if (interfaceName.length < INTERFACE_MINIMUM_LENGTH) {
    return false;
  }
  return /[A-Z]/u.test(interfaceName[INTERFACE_SECOND_CHARACTER_INDEX]);
}

/**
 * Replaces same-file interface declaration and type-reference identifiers.
 *
 * @param program - Program node.
 * @param currentName - Current interface name.
 * @param replacementName - Replacement interface name.
 * @param fixer - ESLint fixer.
 * @returns Generated replacement fixes.
 */
function replaceInterfaceNameReferences(
  program: Readonly<TSESTree.Program>,
  currentName: string,
  replacementName: string,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix[] {
  const fixes: TSESLint.RuleFix[] = [];
  for (const identifier of getInterfaceNameReferenceNodes(program, currentName)) {
    fixes.push(fixer.replaceText(identifier, replacementName));
  }
  return fixes;
}

/**
 * ESLint rule that enforces interface names start with "I".
 */
export const requireInterfacePrefix = createRule({
  name: 'require-interface-prefix',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Enforce that interface names start with "I"',
    },
    messages: {
      interfacePrefix: 'Interface name "{{name}}" should start with "I"',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireInterfacePrefixListeners,
});

export default requireInterfacePrefix;
