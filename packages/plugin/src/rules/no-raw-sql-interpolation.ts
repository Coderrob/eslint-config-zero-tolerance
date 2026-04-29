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
import { createRule } from './support/rule-factory';
import {
  getCalleeName,
  getMemberPath,
  isDynamicString,
} from './support/security-ast';

const DEFAULT_ALLOWED_TAGS = ['sql', 'Prisma.sql', 'db.sql'];
const NON_SQL_TAGS = ['String.raw'];
const DEFAULT_SQL_SINKS = [
  'query',
  'execute',
  'raw',
  '$queryRaw',
  '$executeRaw',
  '$queryRawUnsafe',
  '$executeRawUnsafe',
  'queryRawUnsafe',
  'executeRawUnsafe',
];
const UNSAFE_RAW_SINKS = [
  '$queryRawUnsafe',
  '$executeRawUnsafe',
  'queryRawUnsafe',
  'executeRawUnsafe',
];

interface INoRawSqlInterpolationOptions {
  additionalSinkNames?: readonly string[];
  allowedTags?: readonly string[];
}

enum NoRawSqlInterpolationMessageId {
  RawSqlInterpolation = 'rawSqlInterpolation',
  UnsafeRawSql = 'unsafeRawSql',
}

type NoRawSqlInterpolationContext = Readonly<
  TSESLint.RuleContext<NoRawSqlInterpolationMessageId, [INoRawSqlInterpolationOptions?]>
>;

/**
 * Checks a call expression for raw SQL construction.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 */
function checkCallExpression(
  context: Readonly<NoRawSqlInterpolationContext>,
  options: Readonly<Required<INoRawSqlInterpolationOptions>>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  const calleeName = getCalleeName(node.callee);
  if (!isSqlSinkName(options, calleeName)) {
    return;
  }
  if (UNSAFE_RAW_SINKS.includes(calleeName)) {
    reportUnsafeRawSql(context, node);
    return;
  }
  if (isUnsafeFirstArgument(node)) {
    reportRawSqlInterpolation(context, node.arguments[0]);
  }
}

/**
 * Checks a tagged template for unsafe raw SQL interpolation.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @param node - Tagged template to inspect.
 */
function checkTaggedTemplateExpression(
  context: Readonly<NoRawSqlInterpolationContext>,
  options: Readonly<Required<INoRawSqlInterpolationOptions>>,
  node: Readonly<TSESTree.TaggedTemplateExpression>,
): void {
  if (!isUnsafeSqlTag(options, node)) {
    return;
  }
  reportRawSqlInterpolation(context, node);
}

/**
 * Creates listeners for no-raw-sql-interpolation.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoRawSqlInterpolationListeners(
  context: Readonly<NoRawSqlInterpolationContext>,
): TSESLint.RuleListener {
  const options = normalizeOptions(context.options[0]);
  return {
    CallExpression: checkCallExpression.bind(undefined, context, options),
    TaggedTemplateExpression: checkTaggedTemplateExpression.bind(undefined, context, options),
  };
}

/**
 * Builds the SQL sink name set for the configured rule execution.
 *
 * @param options - Normalized rule options.
 * @returns SQL sink names.
 */
function getSqlSinkNames(options: Readonly<Required<INoRawSqlInterpolationOptions>>): ReadonlySet<string> {
  return new Set([...DEFAULT_SQL_SINKS, ...options.additionalSinkNames]);
}

/**
 * Returns true when the tag is configured safe or known non-SQL syntax.
 *
 * @param options - Normalized rule options.
 * @param tagName - Static tag name.
 * @returns True when the tag should not be reported.
 */
function isAllowedSqlTag(
  options: Readonly<Required<INoRawSqlInterpolationOptions>>,
  tagName: string,
): boolean {
  return options.allowedTags.includes(tagName) || NON_SQL_TAGS.includes(tagName);
}

/**
 * Returns true when a tag is interpolated and targets a SQL sink.
 *
 * @param options - Normalized rule options.
 * @param node - Tagged template to inspect.
 * @param tagName - Static tag name.
 * @returns True when the tag is an unsafe SQL sink.
 */
function isInterpolatedSqlSinkTag(
  options: Readonly<Required<INoRawSqlInterpolationOptions>>,
  node: Readonly<TSESTree.TaggedTemplateExpression>,
  tagName: string,
): boolean {
  return node.quasi.expressions.length > 0 &&
    isSqlSinkName(options, getCalleeName(node.tag) ?? tagName);
}

/**
 * Returns true when a name is a configured SQL sink.
 *
 * @param options - Normalized rule options.
 * @param calleeName - Callee name to inspect.
 * @returns True when the name is a sink.
 */
function isSqlSinkName(
  options: Readonly<Required<INoRawSqlInterpolationOptions>>,
  calleeName: string | null,
): calleeName is string {
  return calleeName !== null && getSqlSinkNames(options).has(calleeName);
}

/**
 * Returns true when the first argument is an interpolated or concatenated string.
 *
 * @param node - Call expression to inspect.
 * @returns True when the first argument is dynamically constructed.
 */
function isUnsafeFirstArgument(node: Readonly<TSESTree.CallExpression>): boolean {
  if (node.arguments.length === 0) {
    return false;
  }
  const firstArgument = node.arguments[0];
  if (firstArgument.type === AST_NODE_TYPES.SpreadElement) {
    return false;
  }
  return isDynamicString(firstArgument);
}

/**
 * Returns true when a tagged template is an unsafe SQL tag.
 *
 * @param options - Normalized rule options.
 * @param node - Tagged template to inspect.
 * @returns True when the tag is interpolated and unsafe.
 */
function isUnsafeSqlTag(
  options: Readonly<Required<INoRawSqlInterpolationOptions>>,
  node: Readonly<TSESTree.TaggedTemplateExpression>,
): boolean {
  const tagName = getMemberPath(node.tag);
  if (tagName === null || isAllowedSqlTag(options, tagName)) {
    return false;
  }
  return isInterpolatedSqlSinkTag(options, node, tagName);
}

/**
 * Applies default options for the rule.
 *
 * @param options - User supplied options.
 * @returns Normalized rule options.
 */
function normalizeOptions(
  options: INoRawSqlInterpolationOptions | undefined,
): Required<INoRawSqlInterpolationOptions> {
  if (options === undefined) {
    return { additionalSinkNames: [], allowedTags: DEFAULT_ALLOWED_TAGS };
  }
  return {
    additionalSinkNames: options.additionalSinkNames ?? [],
    allowedTags: options.allowedTags ?? DEFAULT_ALLOWED_TAGS,
  };
}

/**
 * Reports interpolated or concatenated raw SQL.
 *
 * @param context - ESLint rule execution context.
 * @param node - Node to report.
 */
function reportRawSqlInterpolation(
  context: Readonly<NoRawSqlInterpolationContext>,
  node: TSESTree.Node | undefined,
): void {
  if (node !== undefined) {
    context.report({ node, messageId: NoRawSqlInterpolationMessageId.RawSqlInterpolation });
  }
}

/**
 * Reports usage of an unsafe raw SQL helper.
 *
 * @param context - ESLint rule execution context.
 * @param node - Node to report.
 */
function reportUnsafeRawSql(
  context: Readonly<NoRawSqlInterpolationContext>,
  node: Readonly<TSESTree.Node>,
): void {
  context.report({ node, messageId: NoRawSqlInterpolationMessageId.UnsafeRawSql });
}

/**
 * ESLint rule that blocks interpolated raw SQL and unsafe raw SQL helpers.
 */
export const noRawSqlInterpolation = createRule({
  name: 'no-raw-sql-interpolation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow interpolated raw SQL and unsafe raw query helpers',
    },
    messages: {
      rawSqlInterpolation: 'Raw SQL must not be built with interpolation or string concatenation.',
      unsafeRawSql: 'Unsafe raw SQL helper calls are not allowed.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedTags: { type: 'array', items: { type: 'string' } },
          additionalSinkNames: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createNoRawSqlInterpolationListeners,
});

export default noRawSqlInterpolation;
