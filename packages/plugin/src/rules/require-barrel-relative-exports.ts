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
import { isBarrelFile } from '../helpers/import-path-helpers';
import { createRule } from './support/rule-factory';

const CURRENT_DIRECTORY_PREFIX = './';
const PARENT_DIRECTORY_SEGMENT = '..';

type RequireBarrelRelativeExportsContext = Readonly<
  TSESLint.RuleContext<'relativeBarrelExport', []>
>;
type BarrelReExportNode = TSESTree.ExportAllDeclaration | TSESTree.ExportNamedDeclaration;

/**
 * Checks one barrel re-export declaration for a current-directory descendant path.
 *
 * @param context - ESLint rule execution context.
 * @param node - Re-export declaration to validate.
 */
function checkBarrelReExport(
  context: RequireBarrelRelativeExportsContext,
  node: BarrelReExportNode,
): void {
  if (node.source === null) {
    return;
  }
  if (!isRelativeBarrelExportPath(node.source.value)) {
    reportInvalidBarrelExportPath(context, node);
  }
}

/**
 * Creates listeners for require-barrel-relative-exports rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireBarrelRelativeExportsListeners(
  context: RequireBarrelRelativeExportsContext,
): TSESLint.RuleListener {
  if (!isBarrelFile(context.filename)) {
    return {};
  }
  return {
    ExportAllDeclaration: checkBarrelReExport.bind(undefined, context),
    ExportNamedDeclaration: checkBarrelReExport.bind(undefined, context),
  };
}

/**
 * Returns true when a barrel re-export path stays within the current directory tree.
 *
 * @param exportPath - Re-export path to evaluate.
 * @returns True when the path starts with './', is not the bare './' token, and does not traverse upward.
 */
function isRelativeBarrelExportPath(exportPath: string): boolean {
  if (!exportPath.startsWith(CURRENT_DIRECTORY_PREFIX) || exportPath === CURRENT_DIRECTORY_PREFIX) {
    return false;
  }

  const descendantPath = exportPath.slice(CURRENT_DIRECTORY_PREFIX.length);
  return !descendantPath.split('/').includes(PARENT_DIRECTORY_SEGMENT);
}

/**
 * Reports a barrel re-export that does not target a current-directory descendant path.
 *
 * @param context - ESLint rule execution context.
 * @param node - Re-export declaration to report.
 */
function reportInvalidBarrelExportPath(
  context: RequireBarrelRelativeExportsContext,
  node: BarrelReExportNode,
): void {
  context.report({
    node,
    messageId: 'relativeBarrelExport',
  });
}

/**
 * ESLint rule that requires barrel re-exports to target current-directory descendants.
 */
export const requireBarrelRelativeExports = createRule({
  name: 'require-barrel-relative-exports',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Require barrel re-export declarations to use current-directory descendant paths that start with './'",
    },
    messages: {
      relativeBarrelExport:
        "Barrel re-exports must target current-directory descendant paths that start with './' (for example, export { x } from './x')",
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireBarrelRelativeExportsListeners,
});

export default requireBarrelRelativeExports;
