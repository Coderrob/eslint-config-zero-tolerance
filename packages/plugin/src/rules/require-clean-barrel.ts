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
import { isBarrelFile } from '../helpers/import-path-helpers';
import { createRule } from './support/rule-factory';

type RequireCleanBarrelContext = Readonly<TSESLint.RuleContext<'cleanBarrelOnlyReExports', []>>;

/**
 * Checks a program body and reports statements that violate clean barrel
 * requirements.
 *
 * @param context - ESLint rule execution context.
 * @param program - Program node.
 */
function checkProgram(
  context: Readonly<RequireCleanBarrelContext>,
  program: Readonly<TSESTree.Program>,
): void {
  if (!hasModuleReExport(program.body)) {
    return;
  }
  for (const statement of program.body) {
    if (!isAllowedBarrelStatement(statement)) {
      reportDisallowedBarrelStatement(context, statement);
    }
  }
}

/**
 * Creates listeners for require-clean-barrel rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireCleanBarrelListeners(
  context: Readonly<RequireCleanBarrelContext>,
): TSESLint.RuleListener {
  if (!isBarrelFile(context.filename)) {
    return {};
  }
  return {
    Program: checkProgram.bind(undefined, context),
  };
}

/**
 * Returns true when a program includes at least one module re-export declaration.
 *
 * @param statements - Program statements.
 * @returns True when any statement is a module re-export declaration.
 */
function hasModuleReExport(statements: ReadonlyArray<TSESTree.ProgramStatement>): boolean {
  return statements.some(isAllowedBarrelStatement);
}

/**
 * Returns true when a top-level statement is a module re-export declaration.
 *
 * @param statement - Program statement node.
 * @returns True when the statement is a permitted re-export declaration.
 */
function isAllowedBarrelStatement(statement: Readonly<TSESTree.ProgramStatement>): boolean {
  if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) {
    return true;
  }
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
    return statement.source !== null;
  }
  return false;
}

/**
 * Reports a program statement that is not a module re-export in a barrel file.
 *
 * @param context - ESLint rule execution context.
 * @param statement - Statement to report.
 */
function reportDisallowedBarrelStatement(
  context: Readonly<RequireCleanBarrelContext>,
  statement: Readonly<TSESTree.ProgramStatement>,
): void {
  context.report({
    node: statement,
    messageId: 'cleanBarrelOnlyReExports',
  });
}

/**
 * ESLint rule that requires barrel files to only contain module re-exports.
 */
export const requireCleanBarrel = createRule({
  name: 'require-clean-barrel',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require barrel files (index.*) to contain only module re-export declarations',
    },
    messages: {
      cleanBarrelOnlyReExports:
        'Barrel files should only contain module re-export declarations (for example, export { x } from "./x")',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireCleanBarrelListeners,
});

export default requireCleanBarrel;
