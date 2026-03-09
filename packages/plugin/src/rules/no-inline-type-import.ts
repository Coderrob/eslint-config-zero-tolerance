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
import { createRule } from '../rule-factory';

type NoInlineTypeImportContext = Readonly<TSESLint.RuleContext<'noInlineTypeImport', []>>;

/**
 * Reports TypeScript inline `import("...")` type queries.
 *
 * @param context - ESLint rule execution context.
 * @param node - TS import type node to report.
 */
function reportInlineTypeImport(
  context: NoInlineTypeImportContext,
  node: TSESTree.TSImportType,
): void {
  context.report({
    node,
    messageId: 'noInlineTypeImport',
  });
}

/**
 * Creates listeners that ban inline TypeScript `import("...")` type queries.
 *
 * @param context - ESLint rule execution context.
 * @returns Listener map for the rule.
 */
function createNoInlineTypeImportListeners(
  context: NoInlineTypeImportContext,
): TSESLint.RuleListener {
  return {
    TSImportType: reportInlineTypeImport.bind(undefined, context),
  };
}

/**
 * ESLint rule that disallows TypeScript inline type import queries.
 */
export const noInlineTypeImport = createRule({
  name: 'no-inline-type-import',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow TypeScript inline type imports using import("...")',
    },
    messages: {
      noInlineTypeImport:
        'Inline type import syntax import("...") is not allowed; use top-level import type declarations instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoInlineTypeImportListeners,
});

export default noInlineTypeImport;
