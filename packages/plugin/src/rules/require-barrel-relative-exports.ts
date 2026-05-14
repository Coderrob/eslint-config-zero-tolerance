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

import fs from 'node:fs';
import path from 'node:path';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isBarrelFile } from '../helpers/import-path-helpers';
import { isString } from '../helpers/type-guards';
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
  context: Readonly<RequireBarrelRelativeExportsContext>,
  node: Readonly<BarrelReExportNode>,
): void {
  if (node.source === null) {
    return;
  }
  if (!isRelativeBarrelExportPath(node.source.value)) {
    reportInvalidBarrelExportPath(context, node);
  }
}

/**
 * Creates a fix for bare same-directory barrel re-export paths.
 *
 * @param context - ESLint rule execution context.
 * @param node - Re-export declaration to fix.
 * @returns Fix callback, or null when the target cannot be verified.
 */
function createRelativeBarrelExportFix(
  context: Readonly<RequireBarrelRelativeExportsContext>,
  node: Readonly<BarrelReExportNode>,
): TSESLint.ReportFixFunction | null {
  const exportPath = getBareSameDirectoryExportPath(node);
  if (exportPath === null) {
    return null;
  }
  if (!hasVerifiedSameDirectoryTarget(context.filename, exportPath)) {
    return null;
  }
  return replaceExportPath.bind(undefined, node, `${CURRENT_DIRECTORY_PREFIX}${exportPath}`);
}

/**
 * Creates listeners for require-barrel-relative-exports rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireBarrelRelativeExportsListeners(
  context: Readonly<RequireBarrelRelativeExportsContext>,
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
 * Returns a bare same-directory export path when the source is safely fixable.
 *
 * @param node - Re-export declaration to inspect.
 * @returns Bare export path, or null.
 */
function getBareSameDirectoryExportPath(node: Readonly<BarrelReExportNode>): string | null {
  const exportPath = node.source?.value;
  /* istanbul ignore next -- caller only asks for fixes on re-export declarations with a source. */
  if (!isString(exportPath)) {
    return null;
  }
  return isBareSameDirectoryExportPath(exportPath) ? exportPath : null;
}

/**
 * Returns candidate sibling target paths for a bare export path.
 *
 * @param targetBasePath - Target path without extension.
 * @returns Candidate file and directory paths.
 */
function getSameDirectoryTargetCandidates(targetBasePath: string): readonly string[] {
  return [
    targetBasePath,
    `${targetBasePath}.ts`,
    `${targetBasePath}.tsx`,
    `${targetBasePath}.js`,
    `${targetBasePath}.jsx`,
    path.join(targetBasePath, 'index.ts'),
    path.join(targetBasePath, 'index.js'),
  ];
}

/**
 * Returns true when a same-directory export target exists.
 *
 * @param filename - Barrel file name.
 * @param exportPath - Bare export path.
 * @returns True when a sibling file or directory exists.
 */
function hasVerifiedSameDirectoryTarget(filename: string, exportPath: string): boolean {
  if (!path.isAbsolute(filename)) {
    return false;
  }
  const targetBasePath = path.join(path.dirname(filename), exportPath);
  return getSameDirectoryTargetCandidates(targetBasePath).some(fs.existsSync);
}

/**
 * Returns true when an export path is a bare same-directory candidate.
 *
 * @param exportPath - Export path to inspect.
 * @returns True when the path is a bare relative candidate.
 */
function isBareSameDirectoryExportPath(exportPath: string): boolean {
  return !exportPath.startsWith('.') && !exportPath.startsWith('/') && !exportPath.includes('/');
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
 * Replaces an export source path.
 *
 * @param node - Re-export declaration to fix.
 * @param replacementPath - Replacement export path.
 * @param fixer - ESLint fixer.
 * @returns Generated replacement fix, or null when the source is unavailable.
 */
function replaceExportPath(
  node: Readonly<BarrelReExportNode>,
  replacementPath: string,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix | null {
  /* istanbul ignore next -- fix callbacks are only created for re-export declarations with a source. */
  if (node.source === null) {
    return null;
  }
  return fixer.replaceText(node.source, `'${replacementPath}'`);
}

/**
 * Reports a barrel re-export that does not target a current-directory descendant path.
 *
 * @param context - ESLint rule execution context.
 * @param node - Re-export declaration to report.
 */
function reportInvalidBarrelExportPath(
  context: Readonly<RequireBarrelRelativeExportsContext>,
  node: Readonly<BarrelReExportNode>,
): void {
  context.report({
    node,
    messageId: 'relativeBarrelExport',
    fix: createRelativeBarrelExportFix(context, node),
  });
}

/**
 * ESLint rule that requires barrel re-exports to target current-directory descendants.
 */
export const requireBarrelRelativeExports = createRule({
  name: 'require-barrel-relative-exports',
  meta: {
    type: 'suggestion',
    fixable: 'code',
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
