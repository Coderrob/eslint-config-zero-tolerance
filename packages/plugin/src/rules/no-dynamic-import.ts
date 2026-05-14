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
import { isTestFile } from '../helpers/ast-guards';
import { hasCallCalleeNamePath } from '../helpers/ast/calls';
import { CALLEE_REQUIRE } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type NoDynamicImportContext = Readonly<TSESLint.RuleContext<string, []>>;

/**
 * Checks call expressions and reports `require()` usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression to inspect.
 */
function checkCallExpression(
  context: Readonly<NoDynamicImportContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (!isRequireCall(node)) {
    return;
  }

  reportRequireCall(context, node);
}

/**
 * Creates listeners for non-test files.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoDynamicImportListeners(
  context: Readonly<NoDynamicImportContext>,
): TSESLint.RuleListener {
  if (isTestFile(context.filename)) {
    return {};
  }

  return {
    CallExpression: checkCallExpression.bind(undefined, context),
    ImportExpression: reportDynamicImport.bind(undefined, context),
  };
}

/**
 * Returns true when a call expression targets the global `require`.
 *
 * @param node - Call expression to inspect.
 * @returns True when the callee is the `require` identifier.
 */
function isRequireCall(node: Readonly<TSESTree.CallExpression>): boolean {
  return hasCallCalleeNamePath(node, [CALLEE_REQUIRE]);
}

/**
 * Reports a dynamic import expression.
 *
 * @param context - ESLint rule execution context.
 * @param node - Import expression to report.
 */
function reportDynamicImport(
  context: Readonly<NoDynamicImportContext>,
  node: Readonly<TSESTree.ImportExpression>,
): void {
  context.report({
    node,
    messageId: 'noDynamicImport',
  });
}

/**
 * Reports a `require()` call.
 *
 * @param context - ESLint rule execution context.
 * @param node - Call expression to report.
 */
function reportRequireCall(
  context: Readonly<NoDynamicImportContext>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  context.report({
    node,
    messageId: 'noRequire',
  });
}

/**
 * ESLint rule that bans dynamic imports and require() calls except in test files.
 */
export const noDynamicImport = createRule({
  name: 'no-dynamic-import',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban await import() and require() except in test files',
    },
    messages: {
      noDynamicImport: 'Dynamic import() is not allowed outside of test files',
      noRequire: 'require() is not allowed outside of test files',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoDynamicImportListeners,
});

export default noDynamicImport;
