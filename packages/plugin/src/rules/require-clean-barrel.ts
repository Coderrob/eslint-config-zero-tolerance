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
import { createRule } from '../rule-factory';

type RequireCleanBarrelContext = Readonly<TSESLint.RuleContext<'cleanBarrelOnlyReExports', []>>;

/**
 * Checks a program body and reports statements that violate clean barrel
 * requirements.
 *
 * @param context - ESLint rule execution context.
 * @param program - Program node.
 */
function checkProgram(context: RequireCleanBarrelContext, program: TSESTree.Program): void {
  if (!containsModuleReExport(program.body)) {
    return;
  }
  for (const statement of program.body) {
    if (!isAllowedBarrelStatement(statement)) {
      reportDisallowedBarrelStatement(context, statement);
    }
  }
}

/**
 * Returns true when a program includes at least one module re-export declaration.
 *
 * @param statements - Program statements.
 * @returns True when any statement is a module re-export declaration.
 */
function containsModuleReExport(statements: ReadonlyArray<TSESTree.ProgramStatement>): boolean {
  return statements.some(isAllowedBarrelStatement);
}

/**
 * Creates listeners for require-clean-barrel rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireCleanBarrelListeners(
  context: RequireCleanBarrelContext,
): TSESLint.RuleListener {
  if (!isBarrelFile(context.filename)) {
    return {};
  }
  return {
    Program: checkProgram.bind(undefined, context),
  };
}

/**
 * Returns the file name (last path segment) from a file path.
 *
 * @param filePath - Full or relative file system path.
 * @returns The file name portion of the path.
 */
function getFilename(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1];
}

/**
 * Returns true when a top-level statement is a module re-export declaration.
 *
 * @param statement - Program statement node.
 * @returns True when the statement is a permitted re-export declaration.
 */
function isAllowedBarrelStatement(statement: TSESTree.ProgramStatement): boolean {
  if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) {
    return true;
  }
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
    return statement.source !== null;
  }
  return false;
}

/**
 * Returns true when the file is a barrel file (index.*).
 *
 * Only single-extension index files (for example, `index.ts`, `index.js`, or
 * `index.mts`) are treated as barrel files. Double-extension files such as
 * `index.d.ts`, `index.test.ts`, or `index.spec.js` are intentionally excluded.
 *
 * @param filePath - Path to the current file being linted.
 * @returns True if the file is a barrel index file.
 */
function isBarrelFile(filePath: string): boolean {
  return /^index\.\w+$/u.test(getFilename(filePath));
}

/**
 * Reports a program statement that is not a module re-export in a barrel file.
 *
 * @param context - ESLint rule execution context.
 * @param statement - Statement to report.
 */
function reportDisallowedBarrelStatement(
  context: RequireCleanBarrelContext,
  statement: TSESTree.ProgramStatement,
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
