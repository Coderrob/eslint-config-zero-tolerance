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

import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isPlainObject } from '../helpers/type-guards';
import { createRule } from './support/rule-factory';

export enum RequireBddSpecMessageId {
  InvalidBddSpec = 'invalidBddSpec',
  MissingBddSpec = 'missingBddSpec',
}

type RequireBddSpecContext = Readonly<TSESLint.RuleContext<RequireBddSpecMessageId, []>>;

const BDD_EXTENSION = '.bdd.json';
const TEST_SUFFIX = '.test.ts';

/**
 * Reports missing documents and repository relationship mismatches.
 *
 * @param context - ESLint rule context.
 * @param node - Program node and source export authority.
 */
function checkProgram(
  context: Readonly<RequireBddSpecContext>,
  node: Readonly<TSESTree.Program>,
): void {
  if (context.filename.endsWith(TEST_SUFFIX)) return;
  const specPath = context.filename + BDD_EXTENSION;
  if (!existsSync(specPath)) {
    context.report({ node, messageId: RequireBddSpecMessageId.MissingBddSpec, data: { specPath } });
    return;
  }
  reportRelationshipErrors(context, node, specPath);
}

/**
 * Extracts named exports directly from the parsed ESLint Program.
 *
 * @param program - Program AST supplied by ESLint.
 * @returns Names exported by non-default export declarations.
 */
function collectNamedExports(program: Readonly<TSESTree.Program>): Set<string> {
  return new Set(program.body.flatMap(getStatementExportNames));
}

/**
 * Compares the BDD source reference and documented exports with the linted source.
 *
 * @param spec - Parsed BDD document.
 * @param expectedSourceFile - Repository-relative linted source path.
 * @param actualExports - Named exports discovered from the Program AST.
 * @returns Cross-file relationship diagnostics.
 */
function collectRelationshipErrors(
  spec: unknown,
  expectedSourceFile: string,
  actualExports: Readonly<ReadonlySet<string>>,
): string[] {
  if (!isPlainObject(spec)) return [];
  const sourceErrors = getSourceReferenceErrors(spec, expectedSourceFile);
  const module = spec['module'];
  if (!isPlainObject(module) || !Array.isArray(module['exports'])) return sourceErrors;
  return [...sourceErrors, ...getExportParityErrors(module['exports'], actualExports)];
}

/**
 * Adds identifiers declared by one binding pattern.
 *
 * @param pattern - Variable binding pattern to inspect.
 * @returns Identifiers declared by the binding.
 */
function getBindingNames(pattern: Readonly<TSESTree.Node> | null | undefined): string[] {
  if (pattern === null || pattern === undefined) return [];
  if (pattern.type === AST_NODE_TYPES.Identifier) return [pattern.name];
  return getComplexBindingNames(pattern);
}

/**
 * Returns identifiers declared by a non-identifier binding node.
 *
 * @param pattern - Binding node to inspect.
 * @returns Identifiers declared by the binding.
 */
function getComplexBindingNames(pattern: Readonly<TSESTree.Node>): string[] {
  if (pattern.type === AST_NODE_TYPES.RestElement) return getBindingNames(pattern.argument);
  if (pattern.type === AST_NODE_TYPES.AssignmentPattern) return getBindingNames(pattern.left);
  return getPatternNames(pattern);
}

/**
 * Adds names declared by one exported declaration.
 *
 * @param statement - Named export declaration to inspect.
 * @returns Names declared directly by the export.
 */
function getDeclarationNames(statement: Readonly<TSESTree.ExportNamedDeclaration>): string[] {
  const declaration = statement.declaration;
  if (declaration === null) return [];
  if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
    return declaration.declarations.flatMap((variable) => getBindingNames(variable.id));
  }
  return getIdentifierDeclarationName(declaration);
}

/**
 * Returns named-export parity diagnostics.
 *
 * @param documentedValues - Values from module.exports.
 * @param actualExports - Names exported by the Program AST.
 * @returns Missing-source and missing-documentation diagnostics.
 */
function getExportParityErrors(
  documentedValues: readonly unknown[],
  actualExports: Readonly<ReadonlySet<string>>,
): string[] {
  const documented = new Set(
    documentedValues.filter((name): name is string => typeof name === 'string'),
  );
  return [
    ...[...documented]
      .filter((name) => !actualExports.has(name))
      .map((name) => `source lacks documented export "${name}"`),
    ...[...actualExports]
      .filter((name) => !documented.has(name))
      .map((name) => `BDD document lacks source export "${name}"`),
  ];
}

/**
 * Returns the identifier belonging to a named declaration.
 *
 * @param declaration - Exported declaration candidate.
 * @returns Declared identifier or an empty array.
 */
function getIdentifierDeclarationName(declaration: Readonly<TSESTree.Node>): string[] {
  /* istanbul ignore next -- current named declaration nodes expose an identifier; retain the guard for parser evolution. */
  if (!('id' in declaration) || declaration.id?.type !== AST_NODE_TYPES.Identifier) return [];
  return [declaration.id.name];
}

/**
 * Returns identifiers declared by an array or object binding pattern.
 *
 * @param pattern - Possible destructuring pattern.
 * @returns Identifiers declared by the pattern.
 */
function getPatternNames(pattern: Readonly<TSESTree.Node>): string[] {
  if (pattern.type === AST_NODE_TYPES.ArrayPattern) {
    return pattern.elements.flatMap(getBindingNames);
  }
  /* istanbul ignore next -- callers pass only binding patterns after handling identifiers, rests, and assignments. */
  if (pattern.type !== AST_NODE_TYPES.ObjectPattern) return [];
  return pattern.properties.flatMap((property) =>
    getBindingNames(property.type === AST_NODE_TYPES.Property ? property.value : property.argument),
  );
}

/**
 * Returns an exact source-reference diagnostic when applicable.
 *
 * @param spec - Parsed BDD document object.
 * @param expectedSourceFile - Workspace-relative linted source path.
 * @returns Source-reference diagnostic or an empty array.
 */
function getSourceReferenceErrors(
  spec: Readonly<Record<string, unknown>>,
  expectedSourceFile: string,
): string[] {
  const sourceFile = spec['sourceFile'];
  if (typeof sourceFile !== 'string' || sourceFile === expectedSourceFile) return [];
  return [`"sourceFile" must reference "${expectedSourceFile}"`];
}

/**
 * Returns names contributed by one top-level export statement.
 *
 * @param statement - Program statement to inspect.
 * @returns Named exports contributed by the statement.
 */
function getStatementExportNames(statement: Readonly<TSESTree.ProgramStatement>): string[] {
  if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) return [];
  const declarationNames = getDeclarationNames(statement);
  const specifierNames = statement.specifiers.map((specifier) =>
    specifier.exported.type === AST_NODE_TYPES.Identifier
      ? specifier.exported.name
      : specifier.exported.value,
  );
  return [...declarationNames, ...specifierNames];
}

/**
 * Parses the fields needed for repository relationship checks.
 *
 * @param specPath - Absolute sibling BDD document path.
 * @returns Parsed JSON value, or undefined when parsing fails.
 */
function readSpec(specPath: string): unknown {
  try {
    return JSON.parse(readFileSync(specPath, 'utf8'));
  } catch {
    return undefined;
  }
}

/**
 * Reports repository relationship differences for an existing BDD document.
 *
 * @param context - ESLint rule context.
 * @param node - Program node and source export authority.
 * @param specPath - Existing sibling BDD document path.
 */
function reportRelationshipErrors(
  context: Readonly<RequireBddSpecContext>,
  node: Readonly<TSESTree.Program>,
  specPath: string,
): void {
  const sourceFile = relative(context.cwd, context.filename).replace(/\\/gu, '/');
  const errors = collectRelationshipErrors(
    readSpec(specPath),
    sourceFile,
    collectNamedExports(node),
  );
  if (errors.length > 0) {
    context.report({
      node,
      messageId: RequireBddSpecMessageId.InvalidBddSpec,
      data: { errors: errors.join('\n') },
    });
  }
}

/** Creates the ESLint rule enforcing repository relationships for sibling BDD documents. */
export const requireBddSpec = createRule<[], RequireBddSpecMessageId>({
  name: 'require-bdd-spec',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sibling, source-reference, and export relationships for BDD specs',
    },
    messages: {
      [RequireBddSpecMessageId.InvalidBddSpec]: 'Invalid BDD specification:\n{{errors}}',
      [RequireBddSpecMessageId.MissingBddSpec]:
        'Missing BDD specification. Expected sibling file: {{specPath}}',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates listeners for sibling and relationship validation.
   *
   * @param context - ESLint rule context.
   * @returns Program listener map.
   */
  create(context) {
    return { Program: checkProgram.bind(undefined, context) };
  },
});

export default requireBddSpec;
