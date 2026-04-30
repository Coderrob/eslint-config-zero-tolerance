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
import { createRule } from './support/rule-factory';

type NoForInContext = Readonly<TSESLint.RuleContext<'noForIn', []>>;

/**
 * Creates a fixer that rewrites for..in loops to for..of with Object.keys.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - For-in statement node.
 * @param fixer - ESLint fixer helper.
 * @returns Text replacement fix.
 */
function createForInFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.ForInStatement>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const leftText = sourceCode.getText(node.left);
  const rightText = sourceCode.getText(node.right);
  const bodyText = sourceCode.getText(node.body);
  return fixer.replaceText(node, `for (${leftText} of Object.keys(${rightText})) ${bodyText}`);
}

/**
 * Creates listeners for no-for-in rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoForInListeners(context: Readonly<NoForInContext>): TSESLint.RuleListener {
  return {
    ForInStatement: reportForInUsage.bind(undefined, context),
  };
}

/**
 * Reports usage of for..in loops.
 *
 * @param context - ESLint rule execution context.
 * @param node - For-in statement node.
 */
function reportForInUsage(
  context: Readonly<NoForInContext>,
  node: Readonly<TSESTree.ForInStatement>,
): void {
  context.report({
    node,
    messageId: 'noForIn',
    fix: createForInFix.bind(undefined, context.sourceCode, node),
  });
}

/**
 * ESLint rule that disallows for..in loops.
 */
export const noForIn = createRule({
  name: 'no-for-in',
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'Disallow for..in loops; use Object.keys/values/entries to avoid prototype-chain iteration',
    },
    messages: {
      noForIn:
        'for..in loops iterate over the entire prototype chain. Use Object.{keys,values,entries} instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoForInListeners,
});

export default noForIn;
