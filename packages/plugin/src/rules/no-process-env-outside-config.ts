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
import { isNamedIdentifierNode, isUncomputedMemberExpressionNode } from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';

const CONFIG_DIRECTORY_SEGMENT = '/config/';
const ENV_PROPERTY = 'env';
const PROCESS_IDENTIFIER = 'process';
const BACKSLASH_CODE_POINT = 92;
const WINDOWS_PATH_SEPARATOR = String.fromCodePoint(BACKSLASH_CODE_POINT);
const ALLOWED_CONFIG_BASENAME_PATTERNS = [
  /^(?:.+\.)?config\.[cm]?[jt]sx?$/,
  /^(?:.+\.)?env\.[cm]?[jt]sx?$/,
];

type NoProcessEnvOutsideConfigContext = Readonly<
  TSESLint.RuleContext<'noProcessEnvOutsideConfig', []>
>;

/**
 * Checks member expressions for `process.env` usage outside configuration files.
 *
 * @param context - ESLint rule execution context.
 * @param node - Member expression node.
 */
function checkMemberExpression(
  context: Readonly<NoProcessEnvOutsideConfigContext>,
  node: Readonly<TSESTree.MemberExpression>,
): void {
  if (isAllowedConfigFile(context.filename) || !isProcessEnvMemberExpression(node)) {
    return;
  }
  context.report({
    node,
    messageId: 'noProcessEnvOutsideConfig',
  });
}

/**
 * Creates listeners for process.env checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createNoProcessEnvOutsideConfigListeners(
  context: Readonly<NoProcessEnvOutsideConfigContext>,
): TSESLint.RuleListener {
  return {
    MemberExpression: checkMemberExpression.bind(undefined, context),
  };
}

/**
 * Returns the lowercased basename for a normalized filename.
 *
 * @param normalizedFilename - Filename with forward slashes.
 * @returns Basename segment.
 */
function getBasename(normalizedFilename: string): string {
  return normalizedFilename.slice(normalizedFilename.lastIndexOf('/') + 1);
}

/**
 * Returns true when a basename matches one of the allowed config conventions.
 *
 * @param basename - Lowercased filename basename.
 * @returns True when the basename is a recognized config or env file.
 */
function isAllowedConfigBasename(basename: string): boolean {
  return ALLOWED_CONFIG_BASENAME_PATTERNS.some(
    /** @param pattern - Allowed basename matcher. */
    (pattern) => pattern.test(basename),
  );
}

/**
 * Returns true when the current file is an allowed configuration boundary.
 *
 * @param filename - Absolute or project-relative filename.
 * @returns True when process.env access is allowed in this file.
 */
function isAllowedConfigFile(filename: string): boolean {
  const normalizedFilename = filename
    .split(WINDOWS_PATH_SEPARATOR)
    .join('/')
    .toLowerCase();
  return (
    normalizedFilename.includes(CONFIG_DIRECTORY_SEGMENT) ||
    isAllowedConfigBasename(getBasename(normalizedFilename))
  );
}

/**
 * Returns true when a computed property access targets `"env"`.
 *
 * @param node - Member expression node to inspect.
 * @returns True when the computed property is the env literal.
 */
function isEnvComputedProperty(node: Readonly<TSESTree.MemberExpression>): boolean {
  return (
    node.property.type === AST_NODE_TYPES.Literal &&
    typeof node.property.value === 'string' &&
    node.property.value === ENV_PROPERTY
  );
}

/**
 * Returns true when a member expression is `process.env` or `process["env"]`.
 *
 * @param node - Member expression node to inspect.
 * @returns True when the node targets process.env.
 */
function isProcessEnvMemberExpression(node: Readonly<TSESTree.MemberExpression>): boolean {
  if (!isNamedIdentifierNode(node.object, PROCESS_IDENTIFIER)) {
    return false;
  }
  if (isUncomputedMemberExpressionNode(node)) {
    return isNamedIdentifierNode(node.property, ENV_PROPERTY);
  }
  return isEnvComputedProperty(node);
}

/** ESLint rule that restricts process.env reads to configuration boundaries. */
export const noProcessEnvOutsideConfig = createRule({
  name: 'no-process-env-outside-config',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow process.env reads outside configuration modules; import typed config instead',
    },
    messages: {
      noProcessEnvOutsideConfig:
        'Avoid process.env outside configuration modules; read env once in config and import typed values instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoProcessEnvOutsideConfigListeners,
});

export default noProcessEnvOutsideConfig;
