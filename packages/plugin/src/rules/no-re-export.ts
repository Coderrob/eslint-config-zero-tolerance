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
import { isParentDirectoryImportPath, isBarrelFile } from '../import-path-helpers';
import { createRule } from '../rule-factory';

type NoReExportContext = Readonly<TSESLint.RuleContext<'noReExport', []>>;

/**
 * Checks all export declarations for re-exports from parent modules.
 *
 * @param context - ESLint rule execution context.
 * @param node - Export all declaration node.
 */
function checkExportAllDeclaration(
  context: NoReExportContext,
  node: TSESTree.ExportAllDeclaration,
): void {
  reportIfParentReExport(context, node, node.source.value);
}

/**
 * Checks named export declarations for re-exports from parent modules.
 *
 * @param context - ESLint rule execution context.
 * @param node - Export named declaration node.
 */
function checkExportNamedDeclaration(
  context: NoReExportContext,
  node: TSESTree.ExportNamedDeclaration,
): void {
  if (node.source !== null) {
    reportIfParentReExport(context, node, node.source.value);
  }
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
  return {
    ExportAllDeclaration: checkExportAllDeclaration.bind(undefined, context),
    ExportNamedDeclaration: checkExportNamedDeclaration.bind(undefined, context),
  };
}

/**
 * Reports when an export source traverses to a parent directory.
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
 * ESLint rule that disallows re-export statements from parent or ancestor modules.
 */
export const noReExport = createRule({
  name: 'no-re-export',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow re-export statements from parent or ancestor modules; barrel files (index.*) are exempt from this restriction',
    },
    messages: {
      noReExport:
        'Re-export statements from parent or ancestor modules are not allowed in non-barrel files',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoReExportListeners,
});

export default noReExport;
