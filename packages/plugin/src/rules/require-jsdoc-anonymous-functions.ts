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
import { ANONYMOUS_FUNCTION_NAME } from '../constants';
import { type FunctionNode, isCallExpressionNode, isTestFile } from '../helpers/ast-guards';
import { resolveFunctionName } from '../helpers/ast-helpers';
import { getCalleeNamePath } from '../helpers/ast/calls';
import {
  getJsdocComment,
  getLineIndentation,
  getTargetNode,
  isStandaloneLineTarget,
} from '../helpers/jsdoc-helpers';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

const SUMMARY_DESCRIPTION_PLACEHOLDER = 'TODO: describe';
const TEST_CALLBACK_NAMES = new Set([
  'afterAll',
  'afterEach',
  'beforeAll',
  'beforeEach',
  'context',
  'describe',
  'fdescribe',
  'fit',
  'it',
  'setup',
  'specify',
  'suite',
  'suiteSetup',
  'suiteTeardown',
  'teardown',
  'test',
  'xdescribe',
  'xit',
  'xtest',
]);
const TEST_CALLBACK_MODIFIER_NAMES = new Set([
  'concurrent',
  'each',
  'failing',
  'only',
  'parallel',
  'runIf',
  'serial',
  'skip',
  'skipIf',
]);
const TEST_CALLBACK_NAMESPACE_NAMES = new Set(['Deno']);

export enum RequireJsdocAnonymousFunctionsMessageId {
  MissingJsdoc = 'missingJsdoc',
}

type RequireJsdocAnonymousFunctionsContext = Readonly<
  TSESLint.RuleContext<RequireJsdocAnonymousFunctionsMessageId, []>
>;

/**
 * Builds full JSDoc block text for insertion ahead of an anonymous function target node.
 *
 * @param sourceCode - ESLint source code helper.
 * @param targetNode - Node that should receive the JSDoc comment.
 * @param node - Function node to document.
 * @returns JSDoc block text including trailing newline.
 */
function buildMissingJsdocBlock(
  sourceCode: Readonly<TSESLint.SourceCode>,
  targetNode: TSESTree.Node,
  node: FunctionNode,
): string {
  const indent = getLineIndentation(sourceCode, targetNode);
  const lines = [
    `${indent}/**`,
    `${indent} * ${resolveFunctionName(node)} ${SUMMARY_DESCRIPTION_PLACEHOLDER}`,
    `${indent} */`,
  ];
  return `${lines.join('\n')}\n`;
}

/**
 * Creates fixer for anonymous functions missing a full JSDoc block.
 *
 * @param sourceCode - ESLint source code helper.
 * @param targetNode - Node that owns JSDoc placement.
 * @param node - Function node to document.
 * @param fixer - ESLint fixer helper.
 * @returns Rule fix that inserts generated JSDoc, or null when unsafe.
 */
function createMissingJsdocFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  targetNode: TSESTree.Node,
  node: FunctionNode,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix | null {
  if (targetNode.type === AST_NODE_TYPES.VariableDeclarator) {
    return null;
  }
  if (!isStandaloneLineTarget(sourceCode, targetNode)) {
    return null;
  }
  const lineIndentation = getLineIndentation(sourceCode, targetNode);
  const insertIndex = targetNode.range[0] - lineIndentation.length;
  return fixer.insertTextBeforeRange(
    [insertIndex, insertIndex],
    buildMissingJsdocBlock(sourceCode, targetNode, node),
  );
}

/**
 * Creates listeners for require-jsdoc-anonymous-functions rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireJsdocAnonymousFunctionsListeners(
  context: RequireJsdocAnonymousFunctionsContext,
): TSESLint.RuleListener {
  if (isTestFile(context.filename)) {
    return {};
  }
  const sourceCode = context.sourceCode;
  return createFunctionNodeListeners(
    reportMissingAnonymousJsdoc.bind(undefined, context, sourceCode),
  );
}

/**
 * Returns the last matched test callback segment index in a callee path.
 *
 * @param calleeNamePath - Ordered callee name path.
 * @returns The last callback index, or null when none exists.
 */
function findLastTestCallbackNameIndex(calleeNamePath: readonly string[]): number | null {
  for (let index = calleeNamePath.length - 1; index >= 0; index -= 1) {
    if (TEST_CALLBACK_NAMES.has(calleeNamePath[index])) {
      return index;
    }
  }
  return null;
}

/**
 * Returns true when a callee path matches a known test callback pattern.
 *
 * @param calleeNamePath - Ordered callee name path.
 * @param callbackIndex - Index of the matched callback segment.
 * @returns True when the path shape is recognized as a test callback API.
 */
function hasKnownTestCallbackPathShape(
  calleeNamePath: readonly string[],
  callbackIndex: number,
): boolean {
  return (
    calleeNamePath.slice(0, callbackIndex).every(isKnownTestCallbackPrefixName) &&
    calleeNamePath.slice(callbackIndex + 1).every(isKnownTestCallbackModifierName)
  );
}

/**
 * Returns true when a call expression callee matches a known test callback API.
 *
 * @param callee - Callee node to inspect.
 * @returns True when the callee is a known test callback API.
 */
function isKnownTestCallbackCallee(callee: TSESTree.Node): boolean {
  const calleeNamePath = getCalleeNamePath(callee);
  if (calleeNamePath === null) {
    return false;
  }
  const callbackIndex = findLastTestCallbackNameIndex(calleeNamePath);
  if (callbackIndex === null) {
    return false;
  }
  return hasKnownTestCallbackPathShape(calleeNamePath, callbackIndex);
}

/**
 * Returns true when an anonymous function is a known test framework callback.
 *
 * @param node - Function node to inspect.
 * @returns True when the function is used as a test callback or hook.
 */
function isKnownTestCallbackFunction(node: FunctionNode): boolean {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration || !isCallExpressionNode(node.parent)) {
    return false;
  }
  if (!node.parent.arguments.includes(node)) {
    return false;
  }
  return isKnownTestCallbackCallee(node.parent.callee);
}

/**
 * Returns true when a name is a recognized callback modifier.
 *
 * @param name - Name segment to inspect.
 * @returns True when the name is a callback modifier.
 */
function isKnownTestCallbackModifierName(name: string): boolean {
  return TEST_CALLBACK_MODIFIER_NAMES.has(name);
}

/**
 * Returns true when a name is allowed before the matched callback API segment.
 *
 * @param name - Name segment to inspect.
 * @returns True when the name is an allowed namespace or test API segment.
 */
function isKnownTestCallbackPrefixName(name: string): boolean {
  return TEST_CALLBACK_NAMES.has(name) || TEST_CALLBACK_NAMESPACE_NAMES.has(name);
}

/**
 * Reports missing JSDoc on anonymous function-like constructs.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 */
function reportMissingAnonymousJsdoc(
  context: RequireJsdocAnonymousFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
): void {
  const targetNode = getTargetNode(node);
  if (!shouldReportAnonymousJsdoc(node, sourceCode, targetNode)) {
    return;
  }
  reportMissingAnonymousJsdocForTarget(context, sourceCode, node, targetNode);
}

/**
 * Reports a missing JSDoc comment for a specific anonymous function target.
 *
 * @param context - ESLint rule execution context.
 * @param sourceCode - ESLint source code helper.
 * @param node - Function-like AST node.
 * @param targetNode - JSDoc owner node for the function.
 */
function reportMissingAnonymousJsdocForTarget(
  context: RequireJsdocAnonymousFunctionsContext,
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: FunctionNode,
  targetNode: TSESTree.Node,
): void {
  context.report({
    node,
    messageId: RequireJsdocAnonymousFunctionsMessageId.MissingJsdoc,
    data: { name: ANONYMOUS_FUNCTION_NAME },
    fix: createMissingJsdocFix.bind(undefined, sourceCode, targetNode, node),
  });
}

/**
 * Returns true when an anonymous function target is missing JSDoc.
 *
 * @param node - Function-like AST node.
 * @param sourceCode - ESLint source code helper.
 * @param targetNode - JSDoc owner node for the function.
 * @returns True when the function is anonymous and missing JSDoc.
 */
function shouldReportAnonymousJsdoc(
  node: FunctionNode,
  sourceCode: Readonly<TSESLint.SourceCode>,
  targetNode: TSESTree.Node,
): boolean {
  if (resolveFunctionName(node) !== ANONYMOUS_FUNCTION_NAME) {
    return false;
  }
  if (isKnownTestCallbackFunction(node)) {
    return false;
  }
  return getJsdocComment(sourceCode, targetNode) === null;
}

/** Requires JSDoc for anonymous function-like constructs in non-test source files. */
export const requireJsdocAnonymousFunctions = createRule({
  name: 'require-jsdoc-anonymous-functions',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Require JSDoc comments on anonymous function-like constructs except in test files and known test callbacks',
    },
    messages: {
      missingJsdoc: 'Function "{{name}}" is missing a JSDoc comment',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireJsdocAnonymousFunctionsListeners,
});

export default requireJsdocAnonymousFunctions;
